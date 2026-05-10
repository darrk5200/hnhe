const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'warns.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS noprefix (
    guild_id TEXT NOT NULL,
    user_id  TEXT NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  )
`);

function hasNoPrefix(guildId, userId) {
  return !!db.prepare('SELECT 1 FROM noprefix WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
}

function addNoPrefix(guildId, userId) {
  db.prepare('INSERT OR IGNORE INTO noprefix (guild_id, user_id) VALUES (?, ?)').run(guildId, userId);
}

function removeNoPrefix(guildId, userId) {
  db.prepare('DELETE FROM noprefix WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
}

function listNoPrefix(guildId) {
  return db.prepare('SELECT user_id FROM noprefix WHERE guild_id = ?').all(guildId).map(r => r.user_id);
}

module.exports = { hasNoPrefix, addNoPrefix, removeNoPrefix, listNoPrefix };
