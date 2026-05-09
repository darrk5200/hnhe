const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { queues } = require('../utils/MusicQueue');

async function handlePause(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return '❌ Nothing is playing right now.';
  if (queue.player.state.status === AudioPlayerStatus.Paused) return '⏸ The player is already paused.';
  queue.player.pause();
  return `⏸ Paused **${queue.songs[0].title}**.`;
}

module.exports = {
  name: 'pause',

  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),

  async execute(interaction) {
    const msg = await handlePause(interaction.guildId);
    await interaction.reply(msg);
  },

  async prefixExecute(message) {
    const msg = await handlePause(message.guildId);
    await message.reply(msg);
  }
};
