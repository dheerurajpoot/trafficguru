const { chromium } = require("playwright");
const proxyManager = require("./proxy-manager");
const human = require("./human-behavior");
const db = require("./db");

let running = false;
let queue = null;
let browsers = [];

async function start(config, emit) {
	// Dynamic import for ESM p-queue
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
	let proxyIndex = 0;

	for (let i = 0; i < visits && running; i++) {
		const pageUrl = pages[i % pages.length];

		queue.add(async () => {
			if (!running) return;

			let proxy;
			if (proxyList && proxyList.length > 0) {
				const raw = proxyManager.pickProxy(proxyList, proxyIndex++);
				proxy = proxyManager.buildPlaywrightProxy(raw);
			} else {
				proxy = proxyManager.buildPlaywrightProxy(proxyConfig);
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

				await human.sleep(800, 2000);
				await human.moveMouseNaturally(page);
				await human.sleep(500, 1500);
				await human.scrollNaturally(page);
				await human.hoverRandomLinks(page);
				await human.sleep(minDelay || 2000, maxDelay || 6000);

				completed++;
				db.logVisit({
					url: pageUrl,
					ua,
					proxy: proxy?.server || "none",
					status: "ok",
				});
				emit("visit", {
					url: pageUrl,
					completed,
					total: visits,
					status: "ok",
				});
			} catch (err) {
				db.logVisit({
					url: pageUrl,
					ua: ua || "",
					proxy: proxy?.server || "none",
					status: "error",
					error: err.message,
				});
				emit("visit", {
					url: pageUrl,
					completed,
					total: visits,
					status: "error",
					error: err.message,
				});
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
