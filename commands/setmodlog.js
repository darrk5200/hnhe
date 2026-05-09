const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, saveConfig } = require('../utils/config');

module.exports = {
  name: 'setmodlog',

  data: new SlashCommandBuilder()
    .setName('setmodlog')
    .setDescription('Configure the mod log channel')
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set the channel where mod actions are logged')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('The channel to send mod logs to')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Disable mod logging')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const config = getConfig();

    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      config.modLogChannelId = channel.id;
      saveConfig(config);
      return interaction.reply({
        content: `✅ Mod logs will now be sent to ${channel}.`,
        flags: 64
      });
    }

    if (sub === 'disable') {
      config.modLogChannelId = null;
      saveConfig(config);
      return interaction.reply({
        content: '✅ Mod logging has been disabled.',
        flags: 64
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }

    const config = getConfig();
    const sub = args[0]?.toLowerCase();

    if (sub === 'disable') {
      config.modLogChannelId = null;
      saveConfig(config);
      return message.reply('✅ Mod logging has been disabled.');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Usage: `!setmodlog #channel` or `!setmodlog disable`');
    }

    config.modLogChannelId = channel.id;
    saveConfig(config);
    return message.reply(`✅ Mod logs will now be sent to ${channel}.`);
  }
};
