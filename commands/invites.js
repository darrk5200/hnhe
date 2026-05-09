const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInviteStats } = require('../utils/invites');

async function buildInviteEmbed(target, guildId, client) {
  const stats = getInviteStats(guildId, target.id);

  const recentLines = await Promise.all(stats.recent.map(async row => {
    const user = await client.users.fetch(row.invitee_id).catch(() => null);
    const name = user ? user.tag : `Unknown (${row.invitee_id})`;
    const status = row.left_at ? '❌ Left' : '✅ In server';
    return `• ${name} — ${status}`;
  }));

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📨 Invite Stats — ${target.tag}`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 128 }))
    .addFields(
      { name: '📊 Total Invited', value: `${stats.total}`, inline: true },
      { name: '✅ Currently In Server', value: `${stats.active}`, inline: true },
      { name: '❌ Left Server', value: `${stats.left}`, inline: true }
    )
    .setFooter({ text: `User ID: ${target.id}` })
    .setTimestamp();

  if (recentLines.length > 0) {
    embed.addFields({ name: '🕓 Recent Invites', value: recentLines.join('\n') });
  } else {
    embed.addFields({ name: '🕓 Recent Invites', value: 'No invites recorded yet.' });
  }

  return embed;
}

module.exports = {
  name: 'invites',

  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Check invite stats for a user')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to check (defaults to yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const embed = await buildInviteEmbed(target, interaction.guild.id, interaction.client);
    await interaction.reply({ embeds: [embed] });
  },

  async prefixExecute(message, args) {
    const target = message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null) ||
      message.author;

    const embed = await buildInviteEmbed(target, message.guild.id, message.client);
    await message.reply({ embeds: [embed] });
  }
};
