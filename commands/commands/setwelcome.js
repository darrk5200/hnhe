const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { getConfig, saveConfig } = require('../utils/config');

module.exports = {
  name: 'setwelcome',

  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Configure the welcome message system')
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set the channel where welcome messages are sent')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('The welcome channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable welcome messages')
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
      config.welcomeChannelId = channel.id;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Welcome Channel Set')
        .setDescription(`Welcome messages will now be sent to ${channel}.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled');
      config.welcomeMessageEnabled = enabled;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x57f287 : 0xed4245)
        .setTitle(`${enabled ? '✅ Welcome Messages Enabled' : '❌ Welcome Messages Disabled'}`)
        .setDescription(`Welcome messages have been turned **${enabled ? 'on' : 'off'}**.`)
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
      if (!channel) return message.reply('Please mention a channel. Usage: `!setwelcome channel #channel`');

      config.welcomeChannelId = channel.id;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('✅ Welcome Channel Set')
        .setDescription(`Welcome messages will now be sent to ${channel}.`)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === 'toggle') {
      const val = args[1]?.toLowerCase();
      if (!val || !['true', 'false', 'on', 'off'].includes(val))
        return message.reply('Usage: `!setwelcome toggle true/false`');

      const enabled = val === 'true' || val === 'on';
      config.welcomeMessageEnabled = enabled;
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x57f287 : 0xed4245)
        .setTitle(`${enabled ? '✅ Welcome Messages Enabled' : '❌ Welcome Messages Disabled'}`)
        .setDescription(`Welcome messages have been turned **${enabled ? 'on' : 'off'}**.`)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply('Usage: `!setwelcome channel #channel` or `!setwelcome toggle true/false`');
  }
};
