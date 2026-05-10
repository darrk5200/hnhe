const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard, getThreshold } = require('../utils/levels');
const { getInviteLeaderboard } = require('../utils/invites');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';
const STAR   = '<a:hnBlue_Star:1502946447698432121>';
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  name: 'leaderboard',

  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server leaderboards')
    .addSubcommand(sub =>
      sub.setName('levels').setDescription('Top 10 members by level and messages')
    )
    .addSubcommand(sub =>
      sub.setName('invites').setDescription('Top 10 members by invites')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'levels') return interaction.editReply({ embeds: [await buildLevelsLeaderboard(interaction.guild)] });
    if (sub === 'invites') return interaction.editReply({ embeds: [await buildInvitesLeaderboard(interaction.guild, interaction.client)] });
  },

  async prefixExecute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'levels') return message.reply({ embeds: [await buildLevelsLeaderboard(message.guild)] });
    if (sub === 'invites') return message.reply({ embeds: [await buildInvitesLeaderboard(message.guild, message.client)] });

    return message.reply('Usage: `!leaderboard levels` or `!leaderboard invites`');
  }
};

async function buildLevelsLeaderboard(guild) {
  const rows = getLeaderboard(guild.id, 10);

  const lines = await Promise.all(rows.map(async (row, i) => {
    const medal = MEDALS[i] || `**#${i + 1}**`;
    const user = await guild.client.users.fetch(row.user_id).catch(() => null);
    const name = user ? user.tag : `Unknown (${row.user_id})`;
    const nextThreshold = getThreshold(row.level + 1);
    return `${medal} **${name}**\n${ARROW} Level **${row.level}** • ${row.messages} msgs • Next at ${nextThreshold}`;
  }));

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${STAR} Levels Leaderboard — ${guild.name}`)
    .setDescription(lines.length > 0 ? lines.join('\n\n') : 'No data yet. Start chatting!')
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `Top ${rows.length} members by messages` })
    .setTimestamp();
}

async function buildInvitesLeaderboard(guild, client) {
  const rows = getInviteLeaderboard(guild.id, 10);

  const lines = await Promise.all(rows.map(async (row, i) => {
    const medal = MEDALS[i] || `**#${i + 1}**`;
    const user = await client.users.fetch(row.inviter_id).catch(() => null);
    const name = user ? user.tag : `Unknown (${row.inviter_id})`;
    return `${medal} **${name}**\n${ARROW} ${row.total} total • ✅ ${row.active} in server • ❌ ${row.left_count} left`;
  }));

  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`${DARROW} Invites Leaderboard — ${guild.name}`)
    .setDescription(lines.length > 0 ? lines.join('\n\n') : 'No invite data yet.')
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `Top ${rows.length} members by invites` })
    .setTimestamp();
}
