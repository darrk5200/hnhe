const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { queues } = require('../utils/MusicQueue');

function buildQueueEmbed(queue, guildName) {
  if (!queue || queue.songs.length === 0) {
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📋 Queue')
      .setDescription('The queue is empty.');
  }

  const [current, ...upcoming] = queue.songs;

  const upcomingText = upcoming.length
    ? upcoming
        .slice(0, 10)
        .map((s, i) => `**${i + 1}.** [${s.title}](${s.url}) — \`${s.duration}\` | ${s.requestedBy}`)
        .join('\n')
    : 'No songs queued.';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📋 Queue — ${guildName}`)
    .addFields(
      {
        name: '🎵 Now Playing',
        value: `[${current.title}](${current.url}) — \`${current.duration}\` | ${current.requestedBy}`
      },
      {
        name: `📋 Up Next (${upcoming.length} song${upcoming.length !== 1 ? 's' : ''})`,
        value: upcomingText
      }
    )
    .setTimestamp();

  if (upcoming.length > 10) {
    embed.setFooter({ text: `...and ${upcoming.length - 10} more` });
  }

  return embed;
}

module.exports = {
  name: 'queue',

  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the current music queue'),

  async execute(interaction) {
    const queue = queues.get(interaction.guildId);
    await interaction.reply({ embeds: [buildQueueEmbed(queue, interaction.guild.name)] });
  },

  async prefixExecute(message) {
    const queue = queues.get(message.guildId);
    await message.reply({ embeds: [buildQueueEmbed(queue, message.guild.name)] });
  }
};
