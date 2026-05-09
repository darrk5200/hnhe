const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { getConfig, saveConfig } = require('../utils/config');

module.exports = {
  name: 'setleave',

  data: new SlashCommandBuilder()
    .setName('setleave')
    .setDescription('Configure the leave message system')
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set the channel where leave messages are sent')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('The leave channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable leave messages')
        .addBooleanOption(opt =>
          opt.setName('enabled')
            .setDescription('True to enable, false to disable')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const config = getConfig();

    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      config.leaveChannelId = channel.id;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Leave Channel Set')
        .setDescription(`Leave messages will now be sent to ${channel}.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled');
      config.leaveMessageEnabled = enabled;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x57f287 : 0xed4245)
        .setTitle(`${enabled ? '✅ Leave Messages Enabled' : '❌ Leave Messages Disabled'}`)
        .setDescription(`Leave messages have been turned **${enabled ? 'on' : 'off'}**.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply('You do not have permission to manage server settings.');

    const sub = args[0]?.toLowerCase();
    const config = getConfig();

    if (sub === 'channel') {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply('Please mention a channel. Usage: `!setleave channel #channel`');

      config.leaveChannelId = channel.id;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Leave Channel Set')
        .setDescription(`Leave messages will now be sent to ${channel}.`)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === 'toggle') {
      const val = args[1]?.toLowerCase();
      if (!val || !['true', 'false', 'on', 'off'].includes(val))
        return message.reply('Usage: `!setleave toggle true/false`');

      const enabled = val === 'true' || val === 'on';
      config.leaveMessageEnabled = enabled;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x57f287 : 0xed4245)
        .setTitle(`${enabled ? '✅ Leave Messages Enabled' : '❌ Leave Messages Disabled'}`)
        .setDescription(`Leave messages have been turned **${enabled ? 'on' : 'off'}**.`)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply('Usage: `!setleave channel #channel` or `!setleave toggle true/false`');
  }
};
