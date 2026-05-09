const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

module.exports = {
  name: 'unlock',

  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel so everyone can send messages again')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to unlock (defaults to current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null
    });

    const embed = new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('🔓 Channel Unlocked')
      .setDescription(`${channel} has been unlocked. Everyone can send messages again.`)
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
      SendMessages: null
    });

    const embed = new EmbedBuilder()
      .setColor(0x00cc00)
      .setTitle('🔓 Channel Unlocked')
      .setDescription(`${channel} has been unlocked. Everyone can send messages again.`)
      .addFields({ name: 'Moderator', value: message.author.tag })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};
