const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

module.exports = {
  name: 'lock',

  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel so only admins can send messages')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to lock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false
    });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔒 Channel Locked')
      .setDescription(`${channel} has been locked. Only administrators can send messages.`)
      .addFields({ name: 'Moderator', value: interaction.user.tag })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply('You do not have permission to manage channels.');

    const channel = message.mentions.channels.first() || message.channel;

    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔒 Channel Locked')
      .setDescription(`${channel} has been locked. Only administrators can send messages.`)
      .addFields({ name: 'Moderator', value: message.author.tag })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};
