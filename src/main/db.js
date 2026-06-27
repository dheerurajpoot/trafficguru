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
    )
  `);
}

function logVisit({ url, ua, proxy, status, error }) {
	db.prepare(
		"INSERT INTO visits (url, ua, proxy, status, error) VALUES (?,?,?,?,?)",
	).run(url, ua, proxy, status, error || null);
}

function getStats() {
	const total = db.prepare("SELECT COUNT(*) as c FROM visits").get().c;
	const ok = db
		.prepare("SELECT COUNT(*) as c FROM visits WHERE status='ok'")
		.get().c;
	const errors = db
		.prepare("SELECT COUNT(*) as c FROM visits WHERE status='error'")
		.get().c;
	const recent = db
		.prepare(
			"SELECT url, status, proxy, ts FROM visits ORDER BY ts DESC LIMIT 50",
		)
		.all();
	return { total, ok, errors, recent };
}

module.exports = { init, logVisit, getStats };
