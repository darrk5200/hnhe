const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/warns.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS invite_uses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    inviter_id TEXT NOT NULL,
    invitee_id TEXT NOT NULL,
    invite_code TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    left_at INTEGER DEFAULT NULL
  )
`);

function recordJoin(guildId, inviterId, inviteeId, inviteCode) {
  db.prepare(
    'INSERT INTO invite_uses (guild_id, inviter_id, invitee_id, invite_code, joined_at) VALUES (?, ?, ?, ?, ?)'
  ).run(guildId, inviterId, inviteeId, inviteCode, Date.now());
}

function recordLeave(guildId, inviteeId) {
  db.prepare(
    'UPDATE invite_uses SET left_at = ? WHERE guild_id = ? AND invitee_id = ? AND left_at IS NULL'
  ).run(Date.now(), guildId, inviteeId);
}

function getInviteStats(guildId, inviterId) {
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM invite_uses WHERE guild_id = ? AND inviter_id = ?'
  ).get(guildId, inviterId).count;

  const active = db.prepare(
    'SELECT COUNT(*) as count FROM invite_uses WHERE guild_id = ? AND inviter_id = ? AND left_at IS NULL'
  ).get(guildId, inviterId).count;

  const left = db.prepare(
    'SELECT COUNT(*) as count FROM invite_uses WHERE guild_id = ? AND inviter_id = ? AND left_at IS NOT NULL'
  ).get(guildId, inviterId).count;

  const recent = db.prepare(
    `SELECT invitee_id, joined_at, left_at FROM invite_uses
     WHERE guild_id = ? AND inviter_id = ?
     ORDER BY joined_at DESC LIMIT 5`
  ).all(guildId, inviterId);

  return { total, active, left, recent };
}

function getInviteLeaderboard(guildId, limit = 10) {
  return db.prepare(
    `SELECT inviter_id,
      COUNT(*) as total,
      SUM(CASE WHEN left_at IS NULL THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN left_at IS NOT NULL THEN 1 ELSE 0 END) as left_count
     FROM invite_uses
     WHERE guild_id = ? AND inviter_id != 'unknown'
     GROUP BY inviter_id
     ORDER BY total DESC
     LIMIT ?`
  ).all(guildId, limit);
}

module.exports = { recordJoin, recordLeave, getInviteStats, getInviteLeaderboard };
