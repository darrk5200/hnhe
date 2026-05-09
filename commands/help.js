const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const CATEGORIES = [
  {
    name: '🔨 Moderation',
    value: [
      '`ban` — Ban a member',
      '`kick` — Kick a member',
      '`timeout` — Timeout a member',
      '`warn` — Warn a member',
      '`checkwarns` — View a member\'s warnings',
      '`clearwarn` — Clear a member\'s warnings',
      '`addrole` — Add a role to a member',
      '`removerole` — Remove a role from a member',
      '`lock` — Lock a channel',
      '`unlock` — Unlock a channel',
      '`snipe` — Show last deleted message',
      '`purge <amount> [@user]` — Bulk-delete messages',
      '`setmodlog channel` — Set the mod log channel (Admin only)',
      '`setmodlog disable` — Disable mod logging (Admin only)'
    ].join('\n')
  },
  {
    name: '👋 Welcome & Leave',
    value: [
      '`setwelcome channel` — Set the welcome channel',
      '`setwelcome toggle` — Enable/disable welcome messages',
      '`setleave channel` — Set the leave channel',
      '`setleave toggle` — Enable/disable leave messages'
    ].join('\n')
  },
  {
    name: '📨 Invite Tracker',
    value: [
      '`invites [@user]` — View invite stats for a user',
      '`leaderboard invites` — Top 10 members by invites'
    ].join('\n')
  },
  {
    name: '⭐ Levels',
    value: [
      '`level [@user]` — Check your or another user\'s level',
      '`leaderboard levels` — Top 10 members by level'
    ].join('\n')
  },
  {
    name: '🎫 Tickets',
    value: [
      '`ticket` — Post a ticket panel (Admin only)',
      '`setticketlog channel` — Set the ticket log channel (Admin only)',
      '`setticketlog disable` — Disable ticket logging (Admin only)'
    ].join('\n')
  }
];

module.exports = {
  name: 'help',

  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    const embed = buildHelpEmbed(interaction.client);
    await interaction.reply({ embeds: [embed] });
  },

  async prefixExecute(message) {
    const embed = buildHelpEmbed(message.client);
    await message.reply({ embeds: [embed] });
  }
};

function buildHelpEmbed(client) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📖 Command List — ${client.user.username}`)
    .setDescription('Use `/command` for slash commands or `!command` for prefix commands.')
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 128 }))
    .setFooter({ text: `${client.user.username} • Use slash (/) or prefix (!) commands` })
    .setTimestamp();

  for (const category of CATEGORIES) {
    embed.addFields({ name: category.name, value: category.value });
  }

  return embed;
}
