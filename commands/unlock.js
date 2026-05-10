const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

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
    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });

    const embed = buildEmbed(channel, interaction.user.tag);
    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply('You do not have permission to manage channels.');

    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });

    const embed = buildEmbed(channel, message.author.tag);
    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};

function buildEmbed(channel, modTag) {
  return new EmbedBuilder()
    .setColor(0x00cc00)
    .setTitle(`${DARROW} Channel Unlocked`)
    .setDescription(`${channel} has been unlocked. Everyone can send messages again.`)
    .addFields({ name: `${ARROW} Moderator`, value: modTag })
    .setTimestamp();
}
