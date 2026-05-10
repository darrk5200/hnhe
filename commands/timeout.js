const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

module.exports = {
  name: 'timeout',

  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to timeout').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes (default: 60)').setRequired(false).setMinValue(1).setMaxValue(40320))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the timeout').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const duration = (interaction.options.getInteger('duration') || 60) * 60 * 1000;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (!target.moderatable) return interaction.reply({ content: 'I cannot timeout this user.', flags: 64 });
    if (target.id === interaction.user.id) return interaction.reply({ content: 'You cannot timeout yourself.', flags: 64 });

    await target.timeout(duration, reason);

    const embed = buildEmbed(target.user.tag, target.id, interaction.user.tag, duration / 60000, reason);
    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply('You do not have permission to timeout members.');

    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');
    if (!target.moderatable) return message.reply('I cannot timeout this user.');
    if (target.id === message.author.id) return message.reply('You cannot timeout yourself.');

    const argOffset = message.mentions.members.first() ? 1 : 2;
    let mins = parseInt(args[argOffset]);
    let reasonStart = argOffset;
    if (!isNaN(mins)) { reasonStart = argOffset + 1; } else { mins = 60; }

    const reason = args.slice(reasonStart).join(' ') || 'No reason provided';
    await target.timeout(mins * 60 * 1000, reason);

    const embed = buildEmbed(target.user.tag, target.id, message.author.tag, mins, reason);
    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};

function buildEmbed(userTag, userId, modTag, mins, reason) {
  return new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle(`${DARROW} Member Timed Out`)
    .addFields(
      { name: `${ARROW} User`,      value: `${userTag} (${userId})`, inline: true },
      { name: `${ARROW} Moderator`, value: modTag,                   inline: true },
      { name: `${ARROW} Duration`,  value: `${mins} minute(s)`,      inline: true },
      { name: `${ARROW} Reason`,    value: reason }
    )
    .setTimestamp();
}
