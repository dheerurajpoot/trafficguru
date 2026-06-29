const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let db;

function init() {
	const dbPath = path.join(app.getPath("userData"), "traffic.db");
	db = new Database(dbPath);
	db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT,
      ua TEXT,
      proxy TEXT,
      status TEXT,
      error TEXT,
      ts INTEGER DEFAULT (strftime('%s','now'))
    );
    
    CREATE TABLE IF NOT EXISTS saved_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
    
    CREATE TABLE IF NOT EXISTS saved_proxies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'http',
      host TEXT,
      port TEXT,
      username TEXT,
      password TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

function logVisit({ url, ua, proxy, status, error }) {
	const insertStmt = db.prepare(
		"INSERT INTO visits (url, ua, proxy, status, error) VALUES (?,?,?,?,?)",
	);
	insertStmt.run(url, ua, proxy, status, error || null);

	// Keep only last 20 visits
	const keepIds = db.prepare(
		"SELECT id FROM visits ORDER BY ts DESC LIMIT 20"
	).all().map(row => row.id);
	if (keepIds.length > 0) {
		db.prepare(
			`DELETE FROM visits WHERE id NOT IN (${keepIds.map(() => "?").join(",")})`
		).run(...keepIds);
	}
}

function getStats() {
	const total = db.prepare("SELECT COUNT(*) as c FROM visits").get().c;
	const ok = db.prepare("SELECT COUNT(*) as c FROM visits WHERE status='ok'").get().c;
	const errors = db.prepare("SELECT COUNT(*) as c FROM visits WHERE status='error'").get().c;
	const recent = db.prepare("SELECT id, url, status, proxy, ts FROM visits ORDER BY ts DESC LIMIT 20").all();
	return { total, ok, errors, recent };
}

// Saved Pages functions
function getSavedPages() {
	return db.prepare("SELECT * FROM saved_pages ORDER BY created_at DESC").all();
}

function addSavedPage(url) {
	try {
		db.prepare("INSERT INTO saved_pages (url) VALUES (?)").run(url);
		return { success: true };
	} catch (e) {
		return { success: false, error: "Page already exists" };
	}
}

function deleteSavedPage(id) {
	db.prepare("DELETE FROM saved_pages WHERE id = ?").run(id);
	return { success: true };
}

// Saved Proxies functions
function getSavedProxies() {
	return db.prepare("SELECT * FROM saved_proxies ORDER BY created_at DESC").all();
}

function addSavedProxy(proxy) {
	const stmt = db.prepare("INSERT INTO saved_proxies (type, host, port, username, password) VALUES (?, ?, ?, ?, ?)");
	stmt.run(proxy.type, proxy.host, proxy.port, proxy.username, proxy.password);
	return { success: true };
}

function deleteSavedProxy(id) {
	db.prepare("DELETE FROM saved_proxies WHERE id = ?").run(id);
	return { success: true };
}

// Settings functions
function saveSetting(key, value) {
	db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
}

function getSetting(key, defaultValue = null) {
	const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
	if (!row) return defaultValue;
	try {
		return JSON.parse(row.value);
	} catch (e) {
		return defaultValue;
	}
}

module.exports = { 
	init, logVisit, getStats,
	getSavedPages, addSavedPage, deleteSavedPage,
	getSavedProxies, addSavedProxy, deleteSavedProxy,
	saveSetting, getSetting
};
