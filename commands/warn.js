const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addWarn, getWarns } = require('../utils/database');
const { sendModLog } = require('../utils/modLog');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

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

    const embed = buildEmbed(target.user.tag, target.id, interaction.user.tag, warns.length, reason);
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

    const embed = buildEmbed(target.user.tag, target.id, message.author.tag, warns.length, reason);
    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};

function buildEmbed(userTag, userId, modTag, warnCount, reason) {
  return new EmbedBuilder()
    .setColor(0xffaa00)
    .setTitle(`${DARROW} Member Warned`)
    .addFields(
      { name: `${ARROW} User`,            value: `${userTag} (${userId})`, inline: true },
      { name: `${ARROW} Moderator`,       value: modTag,                   inline: true },
      { name: `${ARROW} Total Warnings`,  value: `${warnCount}`,           inline: true },
      { name: `${ARROW} Reason`,          value: reason }
    )
    .setTimestamp();
}
