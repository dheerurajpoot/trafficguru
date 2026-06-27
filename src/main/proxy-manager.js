const axios = require("axios");

// Supported proxy types: http, socks5
// Supported VPN: openvpn config, windscribe API, nordvpn API, manual

async function test(config) {
	const proxy = buildAxiosProxy(config);
	try {
		const res = await axios.get("https://api.ipify.org?format=json", {
			proxy,
			timeout: 8000,
		});
		return { ok: true, ip: res.data.ip };
	} catch (e) {
		return { ok: false, error: e.message };
	}
}

function buildAxiosProxy(config) {
	if (!config || config.type === "none") return false;

	if (config.type === "http" || config.type === "socks5") {
		return {
			host: config.host,
			port: parseInt(config.port),
			protocol: config.type === "socks5" ? "socks5" : "http",
			auth: config.username
				? { username: config.username, password: config.password }
				: undefined,
		};
	}
	return false;
}

// Build Playwright proxy config from user settings
function buildPlaywrightProxy(config) {
	if (!config || config.type === "none") return undefined;

	if (config.type === "http" || config.type === "socks5") {
		const protocol = config.type === "socks5" ? "socks5" : "http";
		let server = `${protocol}://${config.host}:${config.port}`;
		return {
			server,
			username: config.username || undefined,
			password: config.password || undefined,
		};
	}

	// VPN: system-level — user connects VPN manually or via CLI
	// We just return undefined (Playwright uses system network)
	if (config.type === "vpn") return undefined;

	return undefined;
}

// Rotate from a proxy list
function pickProxy(list, index) {
	if (!list || list.length === 0) return null;
	return list[index % list.length];
}

// Fetch proxies from API (e.g. Webshare, ProxyScrape, Bright Data)
async function fetchFromApi(apiConfig) {
	const { provider, apiKey, endpoint } = apiConfig;
	try {
		if (provider === "webshare") {
			const res = await axios.get(
				"https://proxy.webshare.io/api/v2/proxy/list/",
				{
					headers: { Authorization: `Token ${apiKey}` },
				},
			);
			return res.data.results.map((p) => ({
				type: "http",
				host: p.proxy_address,
				port: p.port,
				username: p.username,
				password: p.password,
			}));
		}

		if (provider === "custom" && endpoint) {
			const res = await axios.get(endpoint, {
				headers: { Authorization: `Bearer ${apiKey}` },
			});
			return res.data; // expects array of proxy objects
		}
	} catch (e) {
		return [];
	}
	return [];
}

module.exports = { test, buildPlaywrightProxy, pickProxy, fetchFromApi };
