const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'snipe',

  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Show the last deleted message in this channel'),

  async execute(interaction) {
    const sniped = interaction.client.snipeCache?.get(interaction.channel.id);

    if (!sniped) {
      return interaction.reply({ content: 'There is nothing to snipe in this channel!', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle('🔍 Sniped Message')
      .setDescription(sniped.content || '*[No text content]*')
      .setAuthor({ name: sniped.author.tag, iconURL: sniped.author.displayAvatarURL() })
      .setFooter({ text: `Deleted in #${interaction.channel.name}` })
      .setTimestamp(sniped.deletedAt);

    await interaction.reply({ embeds: [embed] });
  },

  async prefixExecute(message) {
    const sniped = message.client.snipeCache?.get(message.channel.id);

    if (!sniped) {
      return message.reply('There is nothing to snipe in this channel!');
    }

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle('🔍 Sniped Message')
      .setDescription(sniped.content || '*[No text content]*')
      .setAuthor({ name: sniped.author.tag, iconURL: sniped.author.displayAvatarURL() })
      .setFooter({ text: `Deleted in #${message.channel.name}` })
      .setTimestamp(sniped.deletedAt);

    await message.reply({ embeds: [embed] });
  }
};
