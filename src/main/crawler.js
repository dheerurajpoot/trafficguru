const axios = require("axios");
const cheerio = require("cheerio");

function normalizeUrl(url) {
	const parsed = new URL(url);
	parsed.hash = "";
	return parsed.href;
}

function parseSitemap(xml) {
	const $ = cheerio.load(xml, { xmlMode: true });
	const urls = [];
	const sitemaps = [];

	$("url > loc").each((_, el) => {
		urls.push($(el).text().trim());
	});

	$("sitemap > loc").each((_, el) => {
		sitemaps.push($(el).text().trim());
	});

	return { urls, sitemaps };
}

async function fetchSitemapUrls(sitemapUrl, baseOrigin, maxPages) {
	const res = await axios.get(sitemapUrl, { timeout: 5000 });
	const { urls } = parseSitemap(res.data);

	return urls
		.map((href) => {
			try {
				return normalizeUrl(href);
			} catch (_) {
				return null;
			}
		})
		.filter((href) => href && href.startsWith(baseOrigin))
		.slice(0, maxPages);
}

async function crawl(startUrl, maxPages = 20) {
	const base = new URL(startUrl);
	const visited = new Set();
	const queue = [normalizeUrl(startUrl)];
	const pages = [];

	// Prefer post URLs when a WordPress-style post sitemap exists.
	try {
		const postSitemapUrl = `${base.origin}/post-sitemap.xml`;
		const postUrls = await fetchSitemapUrls(
			postSitemapUrl,
			base.origin,
			maxPages,
		);
		if (postUrls.length > 0) return postUrls;
	} catch (_) {}

	// Fallback: try sitemap.xml and any nested sitemaps it references.
	try {
		const sitemapUrl = `${base.origin}/sitemap.xml`;
		const res = await axios.get(sitemapUrl, { timeout: 5000 });
		const { urls, sitemaps } = parseSitemap(res.data);

		for (const href of urls) {
			try {
				const normalizedHref = normalizeUrl(href);
				if (normalizedHref.startsWith(base.origin) && pages.length < maxPages) {
					pages.push(normalizedHref);
					visited.add(normalizedHref);
				}
			} catch (_) {
				continue;
			}
		}

		for (const nestedSitemapUrl of sitemaps) {
			if (!nestedSitemapUrl.startsWith(base.origin) || pages.length >= maxPages) {
				continue;
			}

			try {
				const nestedUrls = await fetchSitemapUrls(
					nestedSitemapUrl,
					base.origin,
					maxPages - pages.length,
				);

				for (const href of nestedUrls) {
					if (!visited.has(href) && pages.length < maxPages) {
						pages.push(href);
						visited.add(href);
					}
				}
			} catch (_) {}
		}

		if (pages.length > 0) return pages.slice(0, maxPages);
	} catch (_) {}

	// Fallback: crawl links
	while (queue.length > 0 && pages.length < maxPages) {
		const url = queue.shift();
		if (visited.has(url)) continue;
		visited.add(url);

		try {
			const res = await axios.get(url, {
				timeout: 8000,
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; crawler/1.0)",
				},
			});
			pages.push(url);
			const $ = cheerio.load(res.data);
			$("a[href]").each((_, el) => {
				try {
					const href = normalizeUrl(new URL($(el).attr("href"), base.origin).href);
					if (href.startsWith(base.origin) && !visited.has(href)) {
						queue.push(href);
					}
				} catch (_) {}
			});
		} catch (_) {}
	}

	return pages.slice(0, maxPages);
}

module.exports = { crawl };
