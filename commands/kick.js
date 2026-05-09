const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

module.exports = {
  name: 'kick',

  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(opt => opt.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (!target.kickable) return interaction.reply({ content: 'I cannot kick this user.', flags: 64 });
    if (target.id === interaction.user.id) return interaction.reply({ content: 'You cannot kick yourself.', flags: 64 });

    await target.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('👢 Member Kicked')
      .addFields(
        { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
      return message.reply('You do not have permission to kick members.');

    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');
    if (!target.kickable) return message.reply('I cannot kick this user.');
    if (target.id === message.author.id) return message.reply('You cannot kick yourself.');

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('👢 Member Kicked')
      .addFields(
        { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${message.author.tag}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};
