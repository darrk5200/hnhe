const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const { handleWelcome, handleLeave } = require('./utils/memberEvents');
const { incrementMessages } = require('./utils/levels');
const { recordJoin, recordLeave } = require('./utils/invites');
const { getConfig } = require('./utils/config');
const { handleTicketOpen, handleTicketClose } = require('./utils/tickets');

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ]
});

// Collections for commands
client.commands = new Collection();
client.prefixCommands = new Collection();

// Snipe cache: channelId -> { content, author, deletedAt }
client.snipeCache = new Map();

// XP cooldown: `guildId-userId` -> timestamp
client.xpCooldowns = new Map();

// Invite cache: guildId -> Map(code -> invite)
client.inviteCache = new Map();

// Deleted invite buffer: guildId -> Map(code -> invite)
// Holds invites deleted by Discord (single-use) until GuildMemberAdd can read them
client.deletedInviteBuffer = new Map();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) client.commands.set(command.data.name, command);
  if (command.prefixExecute) client.prefixCommands.set(command.name || command.data?.name, command);
}

// ─── Event: Bot ready ────────────────────────────────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log(`📁 Loaded ${client.commands.size} slash commands`);
  console.log(`📁 Loaded ${client.prefixCommands.size} prefix commands`);
  console.log(`🔧 Prefix: ${config.prefix}`);

  // Cache all guild invites
  for (const [, guild] of client.guilds.cache) {
    const invites = await guild.invites.fetch().catch(() => null);
    if (invites) {
      client.inviteCache.set(guild.id, new Map(invites.map(inv => [inv.code, inv])));
      console.log(`📨 Cached ${invites.size} invites for ${guild.name}`);
    }
  }
});

// ─── Event: Welcome + invite tracking on member join ─────────────────────────
client.on(Events.GuildMemberAdd, async member => {
  // Welcome message
  await handleWelcome(member);

  let usedInvite = null;
  let inviterId   = 'unknown';
  let inviteCode  = 'unknown';
  let isVanity    = false;

  try {
    const guild = member.guild;

    // Require Manage Guild — without it Discord won't return invite data
    const botMember = guild.members.me;
    if (!botMember?.permissions.has('ManageGuild')) {
      console.warn('[Invites] Missing Manage Guild permission — invite tracking disabled');
    } else {
      const cachedInvites = client.inviteCache.get(guild.id) || new Map();
      const currentInvites = await guild.invites.fetch();

      // Case 1: Uses count increased on an existing invite
      usedInvite = currentInvites.find(inv => {
        const cached = cachedInvites.get(inv.code);
        // Known invite: uses went up. Unknown to cache but has 1 use: was just created+used
        return cached ? inv.uses > cached.uses : inv.uses === 1;
      });

      // Case 2: Single-use invite deleted BEFORE GuildMemberAdd (buffered in InviteDelete)
      if (!usedInvite) {
        const buffer = client.deletedInviteBuffer.get(guild.id);
        if (buffer && buffer.size > 0) {
          usedInvite = [...buffer.values()].pop();
          buffer.delete(usedInvite.code);
        }
      }

      // Case 3: Invite disappeared from guild but wasn't in buffer
      if (!usedInvite) {
        for (const [code, invite] of cachedInvites) {
          if (!currentInvites.has(code)) {
            usedInvite = invite;
            break;
          }
        }
      }

      // Case 4: Vanity URL (discord.gg/server-name)
      if (!usedInvite && guild.vanityURLCode) {
        try {
          const vanity = await guild.fetchVanityData();
          const cachedVanity = client.vanityUsesCache?.get(guild.id) ?? vanity.uses;
          if (!client.vanityUsesCache) client.vanityUsesCache = new Map();
          if (vanity.uses > cachedVanity) {
            isVanity   = true;
            inviteCode = guild.vanityURLCode;
            inviterId  = 'vanity';
          }
          client.vanityUsesCache.set(guild.id, vanity.uses);
        } catch { /* vanity not available */ }
      }

      // Refresh invite cache with latest data
      client.inviteCache.set(guild.id, new Map(currentInvites.map(inv => [inv.code, inv])));

      if (usedInvite) {
        inviterId  = usedInvite.inviter?.id || 'unknown';
        inviteCode = usedInvite.code || 'unknown';
      }

      console.log(`[Invites] ${member.user.tag} joined | code=${inviteCode} inviter=${inviterId}`);
    }
  } catch (err) {
    console.error('[Invites] Detection error:', err.message);
  }

  // Record in database
  recordJoin(member.guild.id, inviterId, member.id, inviteCode);

  // Send to invites channel
  const cfg = getConfig();
  const channelId = cfg.invitesChannelId;
  if (!channelId || channelId === 'YOUR_INVITES_CHANNEL_ID_HERE') return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  let inviterText = 'Unknown';
  if (isVanity) {
    inviterText = `Vanity URL (\`${inviteCode}\`)`;
  } else if (inviterId !== 'unknown') {
    const inviter = await client.users.fetch(inviterId).catch(() => null);
    inviterText = inviter ? `${inviter.tag} (${inviter.id})` : `Unknown (${inviterId})`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('📨 New Member Joined')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
    .addFields(
      { name: 'Member',          value: `${member.user.tag} (${member.id})`,                                           inline: true },
      { name: 'Invited By',      value: inviterText,                                                                    inline: true },
      { name: 'Invite Code',     value: inviteCode !== 'unknown' ? `\`${inviteCode}\`` : 'Unknown',                     inline: true },
      { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,                     inline: true },
      { name: 'Total Members',   value: `${member.guild.memberCount}`,                                                  inline: true }
    )
    .setFooter({ text: `Member ID: ${member.id}` })
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(err => {
    console.error('[Invites] Failed to send invite log:', err.message);
  });
});

// ─── Event: Record leave + leave message ─────────────────────────────────────
client.on(Events.GuildMemberRemove, async member => {
  await handleLeave(member);
  recordLeave(member.guild.id, member.id);
});

// ─── Event: Update invite cache on new invite ─────────────────────────────────
client.on(Events.InviteCreate, invite => {
  const cached = client.inviteCache.get(invite.guild.id) || new Map();
  cached.set(invite.code, invite);
  client.inviteCache.set(invite.guild.id, cached);
});

// ─── Event: Update invite cache on invite delete ──────────────────────────────
client.on(Events.InviteDelete, invite => {
  // Remove from main cache
  const cached = client.inviteCache.get(invite.guild.id);
  if (cached) cached.delete(invite.code);

  // Store in buffer so GuildMemberAdd can still identify single-use invites
  const buffer = client.deletedInviteBuffer.get(invite.guild.id) || new Map();
  buffer.set(invite.code, invite);
  client.deletedInviteBuffer.set(invite.guild.id, buffer);

  // Auto-expire buffer entry after 10 seconds
  setTimeout(() => {
    const b = client.deletedInviteBuffer.get(invite.guild.id);
    if (b) b.delete(invite.code);
  }, 10000);
});

// ─── Event: Track deleted messages for snipe ─────────────────────────────────
client.on(Events.MessageDelete, message => {
  if (message.author?.bot) return;
  if (!message.guild) return;
  client.snipeCache.set(message.channel.id, {
    content: message.content,
    author: message.author,
    deletedAt: new Date()
  });
});

// ─── Event: Slash commands + button interactions ──────────────────────────────
client.on(Events.InteractionCreate, async interaction => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error executing this command!', flags: 64 });
      } else {
        await interaction.reply({ content: 'There was an error executing this command!', flags: 64 });
      }
    }
    return;
  }

  // Button interactions
  if (interaction.isButton()) {
    const { customId } = interaction;

    if (['ticket_support', 'ticket_reward', 'ticket_others'].includes(customId)) {
      const type = customId.replace('ticket_', '');
      await handleTicketOpen(interaction, type).catch(err => {
        console.error('[Ticket] Open error:', err.message);
      });
      return;
    }

    if (customId === 'ticket_close') {
      await handleTicketClose(interaction).catch(err => {
        console.error('[Ticket] Close error:', err.message);
      });
      return;
    }
  }
});

// ─── Event: XP tracking + prefix command handler ─────────────────────────────
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // XP tracking (15 second cooldown per user)
  const cooldownKey = `${message.guild.id}-${message.author.id}`;
  const lastMessage = client.xpCooldowns.get(cooldownKey) || 0;
  const now = Date.now();

  if (now - lastMessage > 15000) {
    client.xpCooldowns.set(cooldownKey, now);
    const { leveled, newLevel } = incrementMessages(message.guild.id, message.author.id);
    if (leveled) {
      await message.channel.send({
        content: `🎉 Congrats ${message.author}! You reached **Level ${newLevel}**!`
      }).catch(() => {});
    }
  }

  // Prefix command handler
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.prefixExecute(message, args);
  } catch (error) {
    console.error(error);
    await message.reply('There was an error executing this command!');
  }
});

// Login
client.login(process.env.token);
