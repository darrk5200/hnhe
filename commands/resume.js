const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { queues } = require('../utils/MusicQueue');

async function handleResume(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return '❌ Nothing is playing right now.';
  if (queue.player.state.status !== AudioPlayerStatus.Paused) return '▶️ The player is not paused.';
  queue.player.unpause();
  return `▶️ Resumed **${queue.songs[0].title}**.`;
}

module.exports = {
  name: 'resume',

  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),

  async execute(interaction) {
    const msg = await handleResume(interaction.guildId);
    await interaction.reply(msg);
  },

  async prefixExecute(message) {
    const msg = await handleResume(message.guildId);
    await message.reply(msg);
  }
};
