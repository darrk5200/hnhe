const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/warns.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS levels (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    messages INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  )
`);

// Thresholds: Level 1-6 fixed, Level 7+ = 500 + (level - 6) * 250
function getThreshold(level) {
  const fixed = [0, 25, 50, 100, 200, 300, 500];
  if (level <= 6) return fixed[level];
  return 500 + (level - 6) * 250;
}

function getLevelFromMessages(messages) {
  let level = 0;
  while (messages >= getThreshold(level + 1)) {
    level++;
  }
  return level;
}

function getUserData(guildId, userId) {
  let row = db.prepare('SELECT * FROM levels WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
  if (!row) {
    db.prepare('INSERT INTO levels (guild_id, user_id, messages, level) VALUES (?, ?, 0, 0)').run(guildId, userId);
    row = { guild_id: guildId, user_id: userId, messages: 0, level: 0 };
  }
  return row;
}

// Returns { leveled: bool, newLevel: number }
function incrementMessages(guildId, userId) {
  const row = getUserData(guildId, userId);
  const newMessages = row.messages + 1;
  const newLevel = getLevelFromMessages(newMessages);
  const leveled = newLevel > row.level;

  db.prepare('UPDATE levels SET messages = ?, level = ? WHERE guild_id = ? AND user_id = ?')
    .run(newMessages, newLevel, guildId, userId);

  return { leveled, newLevel, messages: newMessages };
}

function getLeaderboard(guildId, limit = 10) {
  return db.prepare(
    'SELECT * FROM levels WHERE guild_id = ? ORDER BY messages DESC LIMIT ?'
  ).all(guildId, limit);
}

module.exports = { getUserData, incrementMessages, getLevelFromMessages, getThreshold, getLeaderboard };
