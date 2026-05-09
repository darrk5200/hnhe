const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Replies with Pong!',
  
  // Slash command data
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  
  // Slash command execution
  async execute(interaction) {
    await interaction.reply('🏓 Pong!');
  },
  
  // Prefix command execution
  async prefixExecute(message, args) {
    await message.reply('🏓 Pong! (via prefix)');
  }
};
