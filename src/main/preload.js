const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
	crawlPages: (opts) => ipcRenderer.invoke("crawl-pages", opts),
	testProxy: (cfg) => ipcRenderer.invoke("test-proxy", cfg),
	startAutomation: (cfg) => ipcRenderer.invoke("start-automation", cfg),
	stopAutomation: () => ipcRenderer.invoke("stop-automation"),
	getStats: () => ipcRenderer.invoke("get-stats"),
	onAutomationEvent: (cb) => {
		ipcRenderer.on("automation-event", (_, data) => cb(data));
		return () => ipcRenderer.removeAllListeners("automation-event");
	},
});
