const { SlashCommandBuilder } = require('discord.js');

const ARROW = '<a:hnblue_arrow:1502946479801765969>';

module.exports = {
  name: 'ping',

  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: `${ARROW} Pinging...`, fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`${ARROW} Pong! Latency: **${latency}ms** | API: **${interaction.client.ws.ping}ms**`);
  },

  async prefixExecute(message) {
    const sent = await message.reply(`${ARROW} Pinging...`);
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`${ARROW} Pong! Latency: **${latency}ms** | API: **${message.client.ws.ping}ms**`);
  }
};
