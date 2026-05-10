const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'warns.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS warns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT DEFAULT 'No reason provided',
    timestamp INTEGER NOT NULL
  )
`);

function addWarn(guildId, userId, moderatorId, reason) {
  const stmt = db.prepare(
    'INSERT INTO warns (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)'
  );
  return stmt.run(guildId, userId, moderatorId, reason || 'No reason provided', Date.now());
}

function getWarns(guildId, userId) {
  const stmt = db.prepare(
    'SELECT * FROM warns WHERE guild_id = ? AND user_id = ? ORDER BY timestamp ASC'
  );
  return stmt.all(guildId, userId);
}

function clearWarns(guildId, userId) {
  const stmt = db.prepare('DELETE FROM warns WHERE guild_id = ? AND user_id = ?');
  return stmt.run(guildId, userId);
}

module.exports = { addWarn, getWarns, clearWarns };
