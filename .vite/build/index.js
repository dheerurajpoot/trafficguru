"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const crawler = require("./crawler");
const proxyManager = require("./proxy-manager");
const automation = require("./automation");
const db = require("./db");
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const devUrl = "http://localhost:5173";
  {
    win.loadURL(devUrl);
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
