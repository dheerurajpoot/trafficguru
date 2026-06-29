const { chromium } = require("playwright");
const proxyManager = require("./proxy-manager");
const human = require("./human-behavior");
const db = require("./db");

let running = false;
let queue = null;
let browsers = [];

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
}

async function start(config, emit) {
	const { default: PQueue } = await import("p-queue");

	running = true;
	const {
		pages,
		visits,
		concurrency,
		headless,
		proxyConfig,
		proxyList,
		minDelay,
		maxDelay,
	} = config;

	queue = new PQueue({ concurrency: concurrency || 2 });

	let completed = 0;
	
	// Prepare proxies: shuffle them
	let proxyPool = [];
	if (proxyList && proxyList.length > 0) {
		proxyPool = shuffleArray(proxyList);
	}

	let proxyIndex = 0;

	for (let i = 0; i < visits && running; i++) {
		const pageUrl = pages[i % pages.length];

		queue.add(async () => {
			if (!running) return;

			let proxy;
			let proxyInfo = "none";
			
			// Get next proxy from shuffled pool
			if (proxyPool.length > 0) {
				const raw = proxyPool[proxyIndex % proxyPool.length];
				proxy = proxyManager.buildPlaywrightProxy(raw);
				if (proxy) {
					proxyInfo = proxy.server;
				}
				proxyIndex++;
			} else {
				proxy = proxyManager.buildPlaywrightProxy(proxyConfig);
				if (proxy) {
					proxyInfo = proxy.server;
				}
			}

			const ua = human.randomUserAgent();
			const viewport = human.randomViewport();
			const referrer = human.randomReferrer(pageUrl);
			const headers = human.realisticHeaders();

			let browser;
			try {
				browser = await chromium.launch({
					headless: headless !== false,
					proxy,
					args: [
						"--no-sandbox",
						"--disable-blink-features=AutomationControlled",
						"--disable-infobars",
						"--disable-dev-shm-usage",
					],
				});
				browsers.push(browser);

				const context = await browser.newContext({
					userAgent: ua,
					viewport,
					extraHTTPHeaders: headers,
					locale: "en-US",
					timezoneId: "America/New_York",
				});

				const page = await context.newPage();
				await human.applyFingerprintSpoofing(page);

				await page.goto(pageUrl, {
					waitUntil: "domcontentloaded",
					timeout: 30000,
					referer: referrer || undefined,
				});

				// More realistic behavior for analytics
				await human.sleep(800, 2000);
				await human.moveMouseNaturally(page);
				await human.sleep(500, 1500);
				await human.scrollNaturally(page);
				await human.hoverRandomLinks(page);
				
				// Additional realistic behavior
				await page.evaluate(() => {
					// Simulate some random mouse movements
					window.scrollBy({ top: Math.random() * 100, left: 0, behavior: 'smooth' });
				});
				
				await human.sleep(minDelay || 2000, maxDelay || 6000);

				completed++;
				db.logVisit({
					url: pageUrl,
					ua,
					proxy: proxyInfo,
					status: "ok",
				});
				emit("visit", {
					url: pageUrl,
					completed,
					total: visits,
					status: "ok",
					proxy: proxyInfo,
				});
			} catch (err) {
				db.logVisit({
					url: pageUrl,
					ua: ua || "",
					proxy: proxyInfo,
					status: "error",
					error: err.message,
				});
				emit("visit", {
					url: pageUrl,
					completed,
					total: visits,
					status: "error",
					error: err.message,
					proxy: proxyInfo,
				});
				
				// Stop automation on errors
				await stop();
			} finally {
				try {
					await browser?.close();
				} catch (_) {}
				browsers = browsers.filter((b) => b !== browser);
			}

			await human.sleep(minDelay || 1000, maxDelay || 4000);
		});
	}

	await queue.onIdle();
	emit("done", { completed });
}

async function stop() {
	running = false;
	if (queue) queue.clear();
	for (const b of browsers) {
		try {
			await b.close();
		} catch (_) {}
	}
	browsers = [];
}

module.exports = { start, stop };
