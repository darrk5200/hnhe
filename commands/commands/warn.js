const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addWarn, getWarns } = require('../utils/database');
const { sendModLog } = require('../utils/modLog');

module.exports = {
  name: 'warn',

  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (target.id === interaction.user.id) return interaction.reply({ content: 'You cannot warn yourself.', flags: 64 });

    addWarn(interaction.guild.id, target.id, interaction.user.id, reason);
    const warns = getWarns(interaction.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle('⚠️ Member Warned')
      .addFields(
        { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Total Warnings', value: `${warns.length}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply('You do not have permission to warn members.');

    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');
    if (target.id === message.author.id) return message.reply('You cannot warn yourself.');

    const reason = args.slice(1).join(' ') || 'No reason provided';
    addWarn(message.guild.id, target.id, message.author.id, reason);
    const warns = getWarns(message.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle('⚠️ Member Warned')
      .addFields(
        { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${message.author.tag}`, inline: true },
        { name: 'Total Warnings', value: `${warns.length}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};
