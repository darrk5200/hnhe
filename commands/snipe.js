const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';

module.exports = {
  name: 'snipe',

  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Show the last deleted message in this channel'),

  async execute(interaction) {
    const sniped = interaction.client.snipeCache?.get(interaction.channel.id);
    if (!sniped) return interaction.reply({ content: 'There is nothing to snipe in this channel!', flags: 64 });

    const embed = buildEmbed(sniped, interaction.channel.name);
    await interaction.reply({ embeds: [embed] });
  },

  async prefixExecute(message) {
    const sniped = message.client.snipeCache?.get(message.channel.id);
    if (!sniped) return message.reply('There is nothing to snipe in this channel!');

    const embed = buildEmbed(sniped, message.channel.name);
    await message.reply({ embeds: [embed] });
  }
};

function buildEmbed(sniped, channelName) {
  return new EmbedBuilder()
    .setColor(0x7289da)
    .setTitle(`${DARROW} Sniped Message`)
    .setDescription(sniped.content || '*[No text content]*')
    .setAuthor({ name: sniped.author.tag, iconURL: sniped.author.displayAvatarURL() })
    .setFooter({ text: `Deleted in #${channelName}` })
    .setTimestamp(sniped.deletedAt);
}
