const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection } = require('@discordjs/voice');
const play = require('play-dl');
const { queues, createQueue, playNext } = require('../utils/MusicQueue');

function formatDuration(seconds) {
  if (!seconds) return 'Live';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

async function resolveSong(query) {
  const type = play.yt_validate(query);
  if (type === 'video') {
    const info = await play.video_info(query);
    const d    = info.video_details;
    return { title: d.title, url: d.url, duration: formatDuration(d.durationInSec), thumbnail: d.thumbnails?.[0]?.url };
  }

  const results = await play.search(query, { source: { youtube: 'video' }, limit: 1 });
  if (!results?.length) return null;
  const v = results[0];
  return { title: v.title, url: v.url, duration: formatDuration(v.durationInSec), thumbnail: v.thumbnails?.[0]?.url };
}

async function handlePlay(guildId, voiceChannel, textChannel, query, requestedBy) {
  let song;
  try {
    song = await resolveSong(query);
  } catch (err) {
    console.error('[Music] Resolve error:', err.message);
    return { error: '❌ Could not find or load that song. Check the URL or search term.' };
  }
  if (!song) return { error: '❌ No results found for that search.' };
  song.requestedBy = requestedBy;

  let queue = queues.get(guildId);

  if (!queue) {
    // Destroy any stale connection that wasn't cleaned up properly
    const stale = getVoiceConnection(guildId);
    if (stale) stale.destroy();

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    connection.on('stateChange', (oldState, newState) => {
      console.log(`[Voice] ${oldState.status} → ${newState.status}`);
    });
    connection.on('error', err => console.error('[Voice] Connection error:', err));

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch (err) {
      console.error('[Voice] Failed to reach Ready state:', err.message, '| Last status:', connection.state.status);
      connection.destroy();
      return { error: `❌ Could not connect to your voice channel (timed out at state: \`${connection.state.status}\`).` };
    }
    queue = createQueue(guildId, connection, textChannel);
    queue.songs.push(song);
    await playNext(guildId);
    return { song, queued: false };
  }

  queue.songs.push(song);
  return { song, queued: true };
}

function buildEmbed(song, queued, position) {
  return new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle(queued ? '➕ Added to Queue' : '🎵 Now Playing')
    .setDescription(`**[${song.title}](${song.url})**`)
    .setThumbnail(song.thumbnail ?? null)
    .addFields(
      { name: '⏱ Duration',      value: song.duration,            inline: true },
      { name: '👤 Requested By', value: `${song.requestedBy}`,    inline: true },
      ...(queued ? [{ name: '📋 Position', value: `#${position}`, inline: true }] : [])
    )
    .setTimestamp();
}

module.exports = {
  name: 'play',

  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption(opt =>
      opt.setName('query')
        .setDescription('YouTube URL or song name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) return interaction.reply({ content: '❌ You need to be in a voice channel.', flags: 64 });

    await interaction.deferReply();
    const query  = interaction.options.getString('query');
    const result = await handlePlay(interaction.guildId, voiceChannel, interaction.channel, query, interaction.user.tag);

    if (result.error) return interaction.editReply(result.error);

    const position = queues.get(interaction.guildId)?.songs.length ?? 1;
    await interaction.editReply({ embeds: [buildEmbed(result.song, result.queued, position)] });
  },

  async prefixExecute(message, args) {
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply('❌ You need to be in a voice channel.');
    if (!args.length) return message.reply('❌ Please provide a song URL or name.');

    const query  = args.join(' ');
    const result = await handlePlay(message.guildId, voiceChannel, message.channel, query, message.author.tag);

    if (result.error) return message.reply(result.error);

    const position = queues.get(message.guildId)?.songs.length ?? 1;
    await message.reply({ embeds: [buildEmbed(result.song, result.queued, position)] });
  }
};
