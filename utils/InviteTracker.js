const fs = require('fs');
const path = require('path');

class InviteTracker {
  constructor(client) {
    this.client = client;
    this.invitesCache = new Map(); // guildId -> Collection<code, Invite>
    this.dataPath = path.join(__dirname, '../data/invite_tracker.json');
    this.ensureDatabase();
  }

  ensureDatabase() {
    if (!fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, JSON.stringify({}, null, 2));
    }
  }

  loadData(guildId) {
    const allData = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
    if (!allData[guildId]) {
      allData[guildId] = { invites: {}, members: {} };
      fs.writeFileSync(this.dataPath, JSON.stringify(allData, null, 2));
    }
    return allData[guildId];
  }

  saveData(guildId, guildData) {
    const allData = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
    allData[guildId] = guildData;
    fs.writeFileSync(this.dataPath, JSON.stringify(allData, null, 2));
  }

  async initializeCache() {
    for (const guild of this.client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        this.invitesCache.set(guild.id, invites);

        const data = this.loadData(guild.id);
        for (const [code, invite] of invites) {
          if (!data.invites[code]) {
            data.invites[code] = {
              code,
              uses: invite.uses ?? 0,
              inviterId: invite.inviter?.id ?? null
            };
          }
        }
        this.saveData(guild.id, data);
        console.log(`📨 Cached ${invites.size} invites for ${guild.name}`);
      } catch (error) {
        console.error(`Failed to fetch invites for guild ${guild.name}:`, error.message);
      }
    }
  }

  // Returns { inviterId, inviteCode } — never throws
  async trackMemberJoin(member) {
    const guild = member.guild;
    const oldInvites = this.invitesCache.get(guild.id);

    let newInvites;
    try {
      newInvites = await guild.invites.fetch();
    } catch (err) {
      console.warn(`[InviteTracker] Could not fetch invites for ${guild.name}: ${err.message}`);
      return { inviterId: 'unknown', inviteCode: 'unknown' };
    }

    // Update cache immediately so the next join compares against fresh data
    this.invitesCache.set(guild.id, newInvites);

    if (!oldInvites) {
      return { inviterId: 'unknown', inviteCode: 'unknown' };
    }

    let usedInvite = null;

    // Case 1: Uses count increased on a known invite
    for (const [code, invite] of newInvites) {
      const old = oldInvites.get(code);
      if (old && (invite.uses ?? 0) > (old.uses ?? 0)) {
        usedInvite = invite;
        break;
      }
    }

    // Case 2: Invite disappeared (single-use or hit max uses — deleted by Discord)
    if (!usedInvite) {
      for (const [code, invite] of oldInvites) {
        if (!newInvites.has(code)) {
          usedInvite = invite;
          break;
        }
      }
    }

    // Case 3: New invite not previously cached but already used
    if (!usedInvite) {
      for (const [code, invite] of newInvites) {
        if (!oldInvites.has(code) && (invite.uses ?? 0) >= 1) {
          usedInvite = invite;
          break;
        }
      }
    }

    if (!usedInvite) {
      return { inviterId: 'unknown', inviteCode: 'unknown' };
    }

    return {
      inviterId: usedInvite.inviter?.id ?? 'unknown',
      inviteCode: usedInvite.code ?? 'unknown'
    };
  }

  trackInviteCreate(invite) {
    const cached = this.invitesCache.get(invite.guild.id);
    if (cached) {
      cached.set(invite.code, invite);
    }
  }

  trackInviteDelete(invite) {
    const cached = this.invitesCache.get(invite.guild.id);
    if (cached) {
      cached.delete(invite.code);
    }
  }
}

module.exports = InviteTracker;
