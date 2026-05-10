const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInviteStats } = require('../utils/invites');

function buildInviteEmbed(target, stats, requestedBy) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Invites - ${target.username}`)
    .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 128 }))
    .setDescription(
      `**Joins :** ${stats.total}\n` +
      `**Left :** ${stats.left}\n` +
      `**Fake :** 0\n` +
      `**Rejoins :** 0`
    )
    .setFooter({ text: `Requested by ${requestedBy.tag}` })
    .setTimestamp();
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
    const stats = getInviteStats(interaction.guild.id, target.id);
    await interaction.reply({ embeds: [buildInviteEmbed(target, stats, interaction.user)] });
  },

  async prefixExecute(message, args) {
    const target = message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null) ||
      message.author;

    const stats = getInviteStats(message.guild.id, target.id);
    await message.reply({ embeds: [buildInviteEmbed(target, stats, message.author)] });
  }
};
