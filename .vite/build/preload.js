"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
  crawlPages: (opts) => ipcRenderer.invoke("crawl-pages", opts),
  testProxy: (cfg) => ipcRenderer.invoke("test-proxy", cfg),
  fetchProxiesFromApi: (cfg) => ipcRenderer.invoke("fetch-proxies-from-api", cfg),
  startAutomation: (cfg) => ipcRenderer.invoke("start-automation", cfg),
  stopAutomation: () => ipcRenderer.invoke("stop-automation"),
  getStats: () => ipcRenderer.invoke("get-stats"),
  onAutomationEvent: (cb) => {
    ipcRenderer.on("automation-event", (_, data) => cb(data));
    return () => ipcRenderer.removeAllListeners("automation-event");
  },
  // Saved Pages
  getSavedPages: () => ipcRenderer.invoke("get-saved-pages"),
  addSavedPage: (url) => ipcRenderer.invoke("add-saved-page", url),
  deleteSavedPage: (id) => ipcRenderer.invoke("delete-saved-page", id),
  // Saved Proxies
  getSavedProxies: () => ipcRenderer.invoke("get-saved-proxies"),
  addSavedProxy: (proxy) => ipcRenderer.invoke("add-saved-proxy", proxy),
  deleteSavedProxy: (id) => ipcRenderer.invoke("delete-saved-proxy", id),
  // Settings
  saveSetting: (key, value) => ipcRenderer.invoke("save-setting", key, value),
  getSetting: (key, defaultValue) => ipcRenderer.invoke("get-setting", key, defaultValue)
});
