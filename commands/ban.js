const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

module.exports = {
  name: 'ban',

  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (!target.bannable) return interaction.reply({ content: 'I cannot ban this user.', flags: 64 });
    if (target.id === interaction.user.id) return interaction.reply({ content: 'You cannot ban yourself.', flags: 64 });

    await target.ban({ reason });

    const embed = buildEmbed(target.user.tag, target.id, interaction.user.tag, reason);
    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply('You do not have permission to ban members.');

    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');
    if (!target.bannable) return message.reply('I cannot ban this user.');
    if (target.id === message.author.id) return message.reply('You cannot ban yourself.');

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.ban({ reason });

    const embed = buildEmbed(target.user.tag, target.id, message.author.tag, reason);
    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};

function buildEmbed(userTag, userId, modTag, reason) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`${DARROW} Member Banned`)
    .addFields(
      { name: `${ARROW} User`,      value: `${userTag} (${userId})`, inline: true },
      { name: `${ARROW} Moderator`, value: modTag,                   inline: true },
      { name: `${ARROW} Reason`,    value: reason }
    )
    .setTimestamp();
}
