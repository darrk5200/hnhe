const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  entersState
} = require('@discordjs/voice');
const play = require('play-dl');

const queues = new Map(); // guildId -> queue object

async function playNext(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;

  if (queue.songs.length === 0) {
    queue.textChannel.send('✅ Queue finished — leaving the voice channel.').catch(() => {});
    queue.connection.destroy();
    queues.delete(guildId);
    return;
  }

  const song = queue.songs[0];
  try {
    const stream = await play.stream(song.url, { quality: 2 });
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    queue.player.play(resource);
  } catch (err) {
    console.error('[Music] Playback error:', err.message);
    queue.textChannel
      .send(`❌ Could not play **${song.title}**, skipping...`)
      .catch(() => {});
    queue.songs.shift();
    playNext(guildId);
  }
}

function createQueue(guildId, connection, textChannel) {
  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
  });

  const queue = { connection, player, songs: [], textChannel };
  queues.set(guildId, queue);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    const q = queues.get(guildId);
    if (!q || q.songs.length === 0) return;
    q.songs.shift();
    playNext(guildId);
  });

  player.on('error', err => {
    console.error('[Music] Player error:', err.message);
    const q = queues.get(guildId);
    if (q) { q.songs.shift(); playNext(guildId); }
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
      ]);
    } catch {
      connection.destroy();
      queues.delete(guildId);
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    queues.delete(guildId);
  });

  return queue;
}

module.exports = { queues, createQueue, playNext };
