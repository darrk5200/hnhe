const Database = require('better-sqlite3');
const path = require('path');
const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const { getConfig } = require('./config');

const db = new Database(path.join(__dirname, '../data/warns.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

function getOpenTicket(guildId, userId) {
  return db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
}

function getTicketByChannel(channelId) {
  return db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
}

function saveTicket(guildId, channelId, userId, type) {
  db.prepare(
    'INSERT INTO tickets (guild_id, channel_id, user_id, type, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(guildId, channelId, userId, type, Date.now());
}

function removeTicket(channelId) {
  db.prepare('DELETE FROM tickets WHERE channel_id = ?').run(channelId);
}

const TYPE_LABELS = { support: 'Support', reward: 'Reward', others: 'Others' };
const TYPE_COLORS = { support: 0x5865f2, reward: 0x57f287, others: 0x99aab5 };

async function sendTicketLog(client, embed) {
  const cfg = getConfig();
  const logChannelId = cfg.ticketLogChannelId;
  if (!logChannelId || logChannelId === 'YOUR_TICKET_LOG_CHANNEL_ID_HERE') return;
  const logChannel = client.channels.cache.get(logChannelId);
  if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
}

async function handleTicketOpen(interaction, type) {
  const config = getConfig();
  const categoryId = config.ticketsCategoryId;

  if (!categoryId || categoryId === 'YOUR_TICKETS_CATEGORY_ID_HERE') {
    return interaction.reply({
      content: '⚠️ Tickets category is not configured yet. Ask an admin to set it up.',
      flags: 64
    });
  }

  // Check for existing open ticket
  const existing = getOpenTicket(interaction.guild.id, interaction.user.id);
  if (existing) {
    const existingChannel = interaction.guild.channels.cache.get(existing.channel_id);
    if (existingChannel) {
      return interaction.reply({
        content: `❌ You already have an open ticket: ${existingChannel}`,
        flags: 64
      });
    }
    removeTicket(existing.channel_id);
  }

  const category = interaction.guild.channels.cache.get(categoryId);
  if (!category) {
    return interaction.reply({
      content: '⚠️ Ticket category not found. Please check the config.',
      flags: 64
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const safeName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
  const channelName = `ticket-${safeName || interaction.user.id.slice(-6)}`;

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels
        ]
      }
    ]
  });

  saveTicket(interaction.guild.id, channel.id, interaction.user.id, type);

  const embed = new EmbedBuilder()
    .setColor(TYPE_COLORS[type] || 0x5865f2)
    .setTitle(`🎫 ${TYPE_LABELS[type] || type} Ticket`)
    .setDescription(
      `Welcome ${interaction.user}! A staff member will be with you shortly.\n\nPlease describe your issue in as much detail as possible.`
    )
    .addFields(
      { name: 'Opened By', value: `${interaction.user.tag}`, inline: true },
      { name: 'Type', value: TYPE_LABELS[type] || type, inline: true }
    )
    .setFooter({ text: 'Use the button below to close this ticket when resolved.' })
    .setTimestamp();

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );

  await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [closeRow] });
  await interaction.editReply({ content: `✅ Your ticket has been opened: ${channel}` });

  // Log ticket open
  const logEmbed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🎫 Ticket Opened')
    .addFields(
      { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Type', value: TYPE_LABELS[type] || type, inline: true },
      { name: 'Channel', value: `${channel}`, inline: true }
    )
    .setFooter({ text: `Channel ID: ${channel.id}` })
    .setTimestamp();

  await sendTicketLog(interaction.client, logEmbed);
}

async function handleTicketClose(interaction) {
  const channel = interaction.channel;
  const ticket = getTicketByChannel(channel.id);

  const openedAt = ticket ? ticket.created_at : null;
  const duration = openedAt
    ? formatDuration(Date.now() - openedAt)
    : 'Unknown';

  removeTicket(channel.id);

  const closingEmbed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('🔒 Ticket Closing')
    .setDescription(`This ticket was closed by ${interaction.user}.\nChannel will be deleted in **5 seconds**.`)
    .setTimestamp();

  await channel.send({ embeds: [closingEmbed] });

  await interaction.reply({ content: '🔒 Ticket closed.', flags: 64 });

  // Log ticket close
  const logEmbed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('🔒 Ticket Closed')
    .addFields(
      { name: 'Closed By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Channel', value: channel.name, inline: true },
      { name: 'Duration Open', value: duration, inline: true }
    );

  if (ticket) {
    const opener = await interaction.client.users.fetch(ticket.user_id).catch(() => null);
    logEmbed.addFields({
      name: 'Ticket Owner',
      value: opener ? `${opener.tag} (${opener.id})` : ticket.user_id,
      inline: true
    });
    logEmbed.addFields({
      name: 'Type',
      value: TYPE_LABELS[ticket.type] || ticket.type,
      inline: true
    });
  }

  logEmbed.setFooter({ text: `Channel ID: ${channel.id}` }).setTimestamp();

  await sendTicketLog(interaction.client, logEmbed);

  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

module.exports = { handleTicketOpen, handleTicketClose };
