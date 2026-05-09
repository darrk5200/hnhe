const { SlashCommandBuilder } = require('discord.js');
const { queues } = require('../utils/MusicQueue');

async function handleSkip(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return '❌ Nothing is playing right now.';
  const skipped = queue.songs[0].title;
  queue.player.stop(); // triggers the Idle event → plays next
  return `⏭ Skipped **${skipped}**.`;
}

module.exports = {
  name: 'skip',

  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction) {
    const msg = await handleSkip(interaction.guildId);
    await interaction.reply(msg);
  },

  async prefixExecute(message) {
    const msg = await handleSkip(message.guildId);
    await message.reply(msg);
  }
};
