const { Collection } = require('discord.js');

class InviteTracker {
  constructor(client) {
    this.client = client;
    this.invites = new Map(); // guildId -> Collection(code, invite)
  }

  // 🔹 Initialize invite cache on bot ready
  async init() {
    for (const guild of this.client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        this.invites.set(guild.id, new Collection(invites));
        console.log(`📨 Cached ${invites.size} invites for ${guild.name}`);
      } catch (err) {
        console.warn(`⚠️ Failed to fetch invites for ${guild.name}: ${err.message}`);
      }
    }
  }

  // 🔹 When a new invite is created
  onInviteCreate(invite) {
    const guildInvites = this.invites.get(invite.guild.id);
    if (guildInvites) {
      guildInvites.set(invite.code, invite);
    }
  }

  // 🔹 When an invite is deleted
  onInviteDelete(invite) {
    const guildInvites = this.invites.get(invite.guild.id);
    if (guildInvites) {
      guildInvites.delete(invite.code);
    }
  }

  // 🔹 Track who invited a member
  async trackJoin(member) {
    const guild = member.guild;

    let oldInvites = this.invites.get(guild.id);

    // Fallback if cache missing
    if (!oldInvites) {
      try {
        oldInvites = await guild.invites.fetch();
        this.invites.set(guild.id, new Collection(oldInvites));
      } catch (err) {
        return { inviterId: 'unknown', code: 'unknown' };
      }
    }

    let newInvites;
    try {
      newInvites = await guild.invites.fetch();
    } catch {
      return { inviterId: 'unknown', code: 'unknown' };
    }

    // Update cache immediately
    this.invites.set(guild.id, new Collection(newInvites));

    let usedInvite = null;

    // ✅ Case 1: Uses increased
    for (const [code, invite] of newInvites) {
      const old = oldInvites.get(code);
      if (old && invite.uses > old.uses) {
        usedInvite = invite;
        break;
      }
    }

    // ✅ Case 2: Invite deleted (1-use or maxed)
    if (!usedInvite) {
      for (const [code, invite] of oldInvites) {
        if (!newInvites.has(code)) {
          usedInvite = invite;
          break;
        }
      }
    }

    // ✅ Case 3: New invite already used
    if (!usedInvite) {
      for (const [code, invite] of newInvites) {
        if (!oldInvites.has(code) && invite.uses > 0) {
          usedInvite = invite;
          break;
        }
      }
    }

    // ✅ Case 4: Vanity URL
    if (!usedInvite) {
      try {
        const vanity = await guild.fetchVanityData();
        if (vanity?.uses) {
          return {
            inviterId: 'vanity',
            code: guild.vanityURLCode || 'vanity'
          };
        }
      } catch {}
    }

    if (!usedInvite) {
      return { inviterId: 'unknown', code: 'unknown' };
    }

    return {
      inviterId: usedInvite.inviter?.id || 'unknown',
      code: usedInvite.code || 'unknown'
    };
  }
}

module.exports = InviteTracker;