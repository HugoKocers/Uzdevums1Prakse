const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Database = require('better-sqlite3');

function openLicenseDatabase() {
  const file = process.env.LICENSE_DB_PATH || path.join(os.homedir(), '.timber-beam-calculator', 'license-dev.sqlite');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(email, key_hash)
    )
  `);
  return db;
}

module.exports = { openLicenseDatabase };
