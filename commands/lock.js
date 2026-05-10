const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

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
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

    const embed = buildEmbed(channel, interaction.user.tag);
    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply('You do not have permission to manage channels.');

    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });

    const embed = buildEmbed(channel, message.author.tag);
    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};

function buildEmbed(channel, modTag) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`${DARROW} Channel Locked`)
    .setDescription(`${channel} has been locked. Only administrators can send messages.`)
    .addFields({ name: `${ARROW} Moderator`, value: modTag })
    .setTimestamp();
}
