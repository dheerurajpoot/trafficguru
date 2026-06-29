const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const crawler = require("./crawler");
const proxyManager = require("./proxy-manager");
const automation = require("./automation");
const db = require("./db");

let win;

function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 850,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	// Safe check for the Vite dev server URL
	const devUrl =
		typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== "undefined"
			? MAIN_WINDOW_VITE_DEV_SERVER_URL
			: null;

	if (devUrl) {
		win.loadURL(devUrl);
	} else {
		// Fallback for dev without Vite processing
		win.loadURL("http://127.0.0.1:5173");
	}
}

app.whenReady().then(() => {
	db.init();
	createWindow();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("crawl-pages", async (_, { url, maxPages }) => {
	return await crawler.crawl(url, maxPages);
});

ipcMain.handle("test-proxy", async (_, proxyConfig) => {
	return await proxyManager.test(proxyConfig);
});

ipcMain.handle("fetch-proxies-from-api", async (_, apiConfig) => {
	return await proxyManager.fetchFromApi(apiConfig);
});

ipcMain.handle("start-automation", async (_, config) => {
	automation.start(config, (event, data) => {
		win.webContents.send("automation-event", { event, data });
	});
	return { started: true };
});

ipcMain.handle("stop-automation", async () => {
	automation.stop();
	return { stopped: true };
});

ipcMain.handle("get-stats", async () => {
	return db.getStats();
});

// Saved Pages
ipcMain.handle("get-saved-pages", async () => db.getSavedPages());
ipcMain.handle("add-saved-page", async (_, url) => db.addSavedPage(url));
ipcMain.handle("delete-saved-page", async (_, id) => db.deleteSavedPage(id));

// Saved Proxies
ipcMain.handle("get-saved-proxies", async () => db.getSavedProxies());
ipcMain.handle("add-saved-proxy", async (_, proxy) => db.addSavedProxy(proxy));
ipcMain.handle("delete-saved-proxy", async (_, id) => db.deleteSavedProxy(id));

// Settings
ipcMain.handle("save-setting", async (_, key, value) =>
	db.saveSetting(key, value),
);
ipcMain.handle("get-setting", async (_, key, defaultValue) =>
	db.getSetting(key, defaultValue),
);
