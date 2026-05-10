const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfig, saveConfig } = require('../utils/config');

module.exports = {
  name: 'setprefix',

  data: new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription('Change the bot prefix (Admin only)')
    .addStringOption(opt =>
      opt.setName('prefix')
        .setDescription('New prefix (max 5 characters)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const newPrefix = interaction.options.getString('prefix').trim();
    if (newPrefix.length > 5) {
      return interaction.reply({ content: '❌ Prefix must be 5 characters or fewer.', flags: 64 });
    }
    applyPrefix(newPrefix);
    await interaction.reply({ content: `✅ Prefix updated to \`${newPrefix}\``, flags: 64 });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }
    const newPrefix = args[0]?.trim();
    if (!newPrefix) return message.reply('❌ Usage: `!setprefix <new prefix>`');
    if (newPrefix.length > 5) return message.reply('❌ Prefix must be 5 characters or fewer.');
    applyPrefix(newPrefix);
    await message.reply(`✅ Prefix updated to \`${newPrefix}\``);
  }
};

function applyPrefix(newPrefix) {
  const config = getConfig();
  config.prefix = newPrefix;
  saveConfig(config);

  // Update the cached require object so index.js picks it up immediately
  // without needing a restart (Node caches JSON modules by resolved path)
  try {
    const cached = require('../config.json');
    cached.prefix = newPrefix;
  } catch {}
}
