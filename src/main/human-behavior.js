const UserAgent = require("user-agents");

// Random int between min and max
function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sleep for random ms in range
function sleep(min, max) {
	const ms = rand(min, max);
	return new Promise((r) => setTimeout(r, ms));
}

// Realistic random user agent (desktop browsers only)
function randomUserAgent() {
	const ua = new UserAgent({ deviceCategory: "desktop" });
	return ua.toString();
}

// Randomize viewport to common screen sizes
function randomViewport() {
	const sizes = [
		{ width: 1920, height: 1080 },
		{ width: 1440, height: 900 },
		{ width: 1366, height: 768 },
		{ width: 1280, height: 800 },
		{ width: 1536, height: 864 },
	];
	return sizes[rand(0, sizes.length - 1)];
}

// Pick a realistic referrer
function randomReferrer(targetUrl) {
	const domain = new URL(targetUrl).hostname;
	const referrers = [
		"https://www.google.com/search?q=" + encodeURIComponent(domain),
		"https://www.bing.com/search?q=" + encodeURIComponent(domain),
		"https://duckduckgo.com/?q=" + encodeURIComponent(domain),
		"https://www.facebook.com/",
		"https://twitter.com/",
		"https://www.reddit.com/",
		"", // direct traffic
		"", // direct traffic (weighted higher)
	];
	return referrers[rand(0, referrers.length - 1)];
}

// Simulate natural mouse movement across several points
async function moveMouseNaturally(page) {
	try {
		const { width, height } = page.viewportSize() || {
			width: 1280,
			height: 800,
		};
		const steps = rand(3, 8);
		for (let i = 0; i < steps; i++) {
			await page.mouse.move(
				rand(50, width - 50),
				rand(100, height - 100),
				{ steps: rand(8, 20) },
			);
			await sleep(80, 300);
		}
	} catch (_) {}
}

// Simulate human scrolling — slow, irregular, sometimes back up
async function scrollNaturally(page) {
	try {
		const scrollHeight = await page.evaluate(
			() => document.body.scrollHeight,
		);
		const viewHeight = await page.evaluate(() => window.innerHeight);
		let pos = 0;

		while (pos < scrollHeight - viewHeight) {
			const scrollAmount = rand(120, 400);
			pos += scrollAmount;
			await page.evaluate(
				(y) => window.scrollTo({ top: y, behavior: "smooth" }),
				pos,
			);
			await sleep(400, 1200);

			// Occasionally scroll back up a bit (like a real reader)
			if (Math.random() < 0.2) {
				pos -= rand(80, 200);
				await page.evaluate(
					(y) =>
						window.scrollTo({
							top: Math.max(0, y),
							behavior: "smooth",
						}),
					pos,
				);
				await sleep(300, 800);
			}
		}
	} catch (_) {}
}

// Hover over random links without clicking
async function hoverRandomLinks(page) {
	try {
		const links = await page.$$("a[href]");
		const count = Math.min(links.length, rand(2, 5));
		const chosen = links.sort(() => 0.5 - Math.random()).slice(0, count);
		for (const link of chosen) {
			await link.hover().catch(() => {});
			await sleep(200, 600);
		}
	} catch (_) {}
}

// Override browser fingerprint to reduce bot detection
async function applyFingerprintSpoofing(page) {
	await page.addInitScript(() => {
		// Hide webdriver flag
		Object.defineProperty(navigator, "webdriver", { get: () => false });

		// Fake plugins list
		Object.defineProperty(navigator, "plugins", {
			get: () => [
				{ name: "Chrome PDF Plugin" },
				{ name: "Chrome PDF Viewer" },
				{ name: "Native Client" },
			],
		});

		// Fake language
		Object.defineProperty(navigator, "languages", {
			get: () => ["en-US", "en"],
		});

		// Override permissions
		const origQuery = window.navigator.permissions?.query;
		if (origQuery) {
			window.navigator.permissions.query = (params) =>
				params.name === "notifications"
					? Promise.resolve({ state: Notification.permission })
					: origQuery(params);
		}

		// Spoof screen resolution
		Object.defineProperty(screen, "availWidth", {
			get: () => window.outerWidth,
		});
		Object.defineProperty(screen, "availHeight", {
			get: () => window.outerHeight,
		});

		// Remove automation markers from chrome object
		if (window.chrome) {
			window.chrome.runtime = window.chrome.runtime || {};
		}
	});
}

// Set random accept-language and other realistic headers
function realisticHeaders() {
	const langs = [
		"en-US,en;q=0.9",
		"en-GB,en;q=0.9",
		"en-US,en;q=0.8,es;q=0.5",
	];
	return {
		"Accept-Language": langs[rand(0, langs.length - 1)],
		Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
		"Accept-Encoding": "gzip, deflate, br",
		"Cache-Control": "no-cache",
		Pragma: "no-cache",
		"Sec-Fetch-Dest": "document",
		"Sec-Fetch-Mode": "navigate",
		"Sec-Fetch-Site": "cross-site",
		"Upgrade-Insecure-Requests": "1",
	};
}

module.exports = {
	sleep,
	rand,
	randomUserAgent,
	randomViewport,
	randomReferrer,
	moveMouseNaturally,
	scrollNaturally,
	hoverRandomLinks,
	applyFingerprintSpoofing,
	realisticHeaders,
};
