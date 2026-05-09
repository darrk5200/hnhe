const { SlashCommandBuilder } = require('discord.js');
const { queues } = require('../utils/MusicQueue');

async function handleStop(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return '❌ Nothing is playing right now.';
  queue.songs = [];          // clear queue so Idle event doesn't start next song
  queue.player.stop(true);   // force-stop
  queue.connection.destroy();
  queues.delete(guildId);
  return '⏹ Stopped the music and cleared the queue.';
}

module.exports = {
  name: 'stop',

  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  async execute(interaction) {
    const msg = await handleStop(interaction.guildId);
    await interaction.reply(msg);
  },

  async prefixExecute(message) {
    const msg = await handleStop(message.guildId);
    await message.reply(msg);
  }
};
