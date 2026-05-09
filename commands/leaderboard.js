const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard, getThreshold } = require('../utils/levels');
const { getInviteLeaderboard } = require('../utils/invites');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  name: 'leaderboard',

  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server leaderboards')
    .addSubcommand(sub =>
      sub.setName('levels')
        .setDescription('Top 10 members by level and messages')
    )
    .addSubcommand(sub =>
      sub.setName('invites')
        .setDescription('Top 10 members by invites')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (sub === 'levels') {
      const embed = await buildLevelsLeaderboard(interaction.guild);
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'invites') {
      const embed = await buildInvitesLeaderboard(interaction.guild, interaction.client);
      return interaction.editReply({ embeds: [embed] });
    }
  },

  async prefixExecute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'levels') {
      const embed = await buildLevelsLeaderboard(message.guild);
      return message.reply({ embeds: [embed] });
    }

    if (sub === 'invites') {
      const embed = await buildInvitesLeaderboard(message.guild, message.client);
      return message.reply({ embeds: [embed] });
    }

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
    return `${medal} **${name}**\nLevel **${row.level}** • ${row.messages} msgs • Next level at ${nextThreshold}`;
  }));

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`⭐ Levels Leaderboard — ${guild.name}`)
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
    return `${medal} **${name}**\n${row.total} total • ✅ ${row.active} in server • ❌ ${row.left_count} left`;
  }));

  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📨 Invites Leaderboard — ${guild.name}`)
    .setDescription(lines.length > 0 ? lines.join('\n\n') : 'No invite data yet.')
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `Top ${rows.length} members by invites` })
    .setTimestamp();
}
