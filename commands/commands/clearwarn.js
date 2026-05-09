const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { clearWarns, getWarns } = require('../utils/database');
const { sendModLog } = require('../utils/modLog');

module.exports = {
  name: 'clearwarn',

  data: new SlashCommandBuilder()
    .setName('clearwarn')
    .setDescription('Clear all warnings for a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to clear warnings for').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (!target) return interaction.reply({ content: 'User not found.', flags: 64 });

    const before = getWarns(interaction.guild.id, target.id).length;
    clearWarns(interaction.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle('🧹 Warnings Cleared')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Warnings Removed', value: `${before}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply('You do not have permission to manage warnings.');

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');

    const before = getWarns(message.guild.id, target.id).length;
    clearWarns(message.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle('🧹 Warnings Cleared')
      .addFields(
        { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${message.author.tag}`, inline: true },
        { name: 'Warnings Removed', value: `${before}`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};
