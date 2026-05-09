const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, getLevelFromMessages, getThreshold } = require('../utils/levels');

function buildLevelEmbed(user, data) {
  const currentLevel = data.level;
  const messages = data.messages;
  const currentThreshold = getThreshold(currentLevel);
  const nextThreshold = getThreshold(currentLevel + 1);
  const progress = messages - currentThreshold;
  const needed = nextThreshold - currentThreshold;

  const barFilled = Math.round((progress / needed) * 10);
  const bar = '█'.repeat(barFilled) + '░'.repeat(10 - barFilled);

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`⭐ Level — ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
    .addFields(
      { name: 'Level', value: `**${currentLevel}**`, inline: true },
      { name: 'Messages', value: `**${messages}**`, inline: true },
      { name: 'Next Level', value: `**${currentLevel + 1}**`, inline: true },
      {
        name: `Progress to Level ${currentLevel + 1}`,
        value: `\`${bar}\` ${progress}/${needed} messages`
      }
    )
    .setFooter({ text: `${nextThreshold - messages} more messages to level up` })
    .setTimestamp();
}

module.exports = {
  name: 'level',

  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your level or another user\'s level')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to check (defaults to yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const data = getUserData(interaction.guild.id, target.id);
    const embed = buildLevelEmbed(target, data);
    await interaction.reply({ embeds: [embed] });
  },

  async prefixExecute(message, args) {
    const target = message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null) ||
      message.author;

    const data = getUserData(message.guild.id, target.id);
    const embed = buildLevelEmbed(target, data);
    await message.reply({ embeds: [embed] });
  }
};
