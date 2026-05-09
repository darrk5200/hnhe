const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, saveConfig } = require('../utils/config');

module.exports = {
  name: 'setticketlog',

  data: new SlashCommandBuilder()
    .setName('setticketlog')
    .setDescription('Configure the ticket log channel')
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set the channel where ticket logs are sent')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('The channel to send ticket logs to')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Disable ticket logging')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const config = getConfig();

    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      config.ticketLogChannelId = channel.id;
      saveConfig(config);
      return interaction.reply({
        content: `✅ Ticket logs will now be sent to ${channel}.`,
        flags: 64
      });
    }

    if (sub === 'disable') {
      config.ticketLogChannelId = null;
      saveConfig(config);
      return interaction.reply({
        content: '✅ Ticket logging has been disabled.',
        flags: 64
      });
    }
  },

  async prefixExecute(message, args) {
    const config = getConfig();

    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }

    const sub = args[0]?.toLowerCase();

    if (sub === 'disable') {
      config.ticketLogChannelId = null;
      saveConfig(config);
      return message.reply('✅ Ticket logging has been disabled.');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Usage: `!setticketlog #channel` or `!setticketlog disable`');
    }

    config.ticketLogChannelId = channel.id;
    saveConfig(config);
    return message.reply(`✅ Ticket logs will now be sent to ${channel}.`);
  }
};
