const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const { handleWelcome, handleLeave } = require('./utils/memberEvents');
const { incrementMessages } = require('./utils/levels');
const { recordJoin, recordLeave } = require('./utils/invites');
const { getConfig } = require('./utils/config');
const { handleTicketOpen, handleTicketClose, handleTicketTranscript } = require('./utils/tickets');
const { hasNoPrefix } = require('./utils/noprefix');
const InviteTracker = require('./utils/InviteTracker');

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

// Invite tracker
const inviteTracker = new InviteTracker(client);

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

  await inviteTracker.init();
});

// ─── Event: Welcome + invite tracking on member join ─────────────────────────
client.on(Events.GuildMemberAdd, async member => {
  // Welcome message
  await handleWelcome(member);

  const { inviterId, code: inviteCode } = await inviteTracker.trackJoin(member);
  console.log(`[Invites] ${member.user.tag} joined | code=${inviteCode} inviter=${inviterId}`);

  // Record in database
  recordJoin(member.guild.id, inviterId, member.id, inviteCode);

  // Send to invites channel
  const cfg = getConfig();
  const channelId = cfg.invitesChannelId;
  if (!channelId || channelId === 'YOUR_INVITES_CHANNEL_ID_HERE') return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  let inviterText = 'Unknown';
  if (inviterId !== 'unknown') {
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


client.on('inviteCreate', invite => {
  inviteTracker.onInviteCreate(invite);
});

client.on('inviteDelete', invite => {
  inviteTracker.onInviteDelete(invite);
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

    if (customId === 'ticket_transcript') {
      await handleTicketTranscript(interaction).catch(err => {
        console.error('[Ticket] Transcript error:', err.message);
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

  // Respond when the bot is mentioned directly
  if (message.mentions.users.has(client.user.id) && message.content.trim().replace(`<@${client.user.id}>`, '').trim() === '') {
    return message.reply('Use `!help` to see commands');
  }

  // Prefix command handler — supports both prefixed and prefix-free users
  const startsWithPrefix = message.content.startsWith(config.prefix);
  const noPrefixUser = !startsWithPrefix && hasNoPrefix(message.guildId, message.author.id);

  if (!startsWithPrefix && !noPrefixUser) return;

  const rawContent = startsWithPrefix
    ? message.content.slice(config.prefix.length).trim()
    : message.content.trim();

  const args = rawContent.split(/ +/);
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
