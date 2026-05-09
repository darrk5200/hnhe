const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

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

    const mins = duration / 60000;
    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle('⏱️ Member Timed Out')
      .addFields(
        { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Duration', value: `${mins} minute(s)`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

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

    if (!isNaN(mins)) {
      reasonStart = argOffset + 1;
    } else {
      mins = 60;
    }

    const reason = args.slice(reasonStart).join(' ') || 'No reason provided';
    await target.timeout(mins * 60 * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle('⏱️ Member Timed Out')
      .addFields(
        { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${message.author.tag}`, inline: true },
        { name: 'Duration', value: `${mins} minute(s)`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};
