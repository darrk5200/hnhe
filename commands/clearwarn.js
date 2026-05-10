const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { clearWarns, getWarns } = require('../utils/database');
const { sendModLog } = require('../utils/modLog');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

module.exports = {
  name: 'clearwarn',

  data: new SlashCommandBuilder()
    .setName('clearwarn')
    .setDescription('Clear all warnings for a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to clear warnings for').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (!target) return interaction.reply({ content: 'User not found.', flags: 64 });

    const before = getWarns(interaction.guild.id, target.id).length;
    clearWarns(interaction.guild.id, target.id);

    const embed = buildEmbed(target.tag, target.id, interaction.user.tag, before);
    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply('You do not have permission to manage warnings.');

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');

    const before = getWarns(message.guild.id, target.id).length;
    clearWarns(message.guild.id, target.id);

    const embed = buildEmbed(target.tag, target.id, message.author.tag, before);
    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};

function buildEmbed(userTag, userId, modTag, count) {
  return new EmbedBuilder()
    .setColor(0x00aaff)
    .setTitle(`${DARROW} Warnings Cleared`)
    .addFields(
      { name: `${ARROW} User`,             value: `${userTag} (${userId})`, inline: true },
      { name: `${ARROW} Moderator`,        value: modTag,                   inline: true },
      { name: `${ARROW} Warnings Removed`, value: `${count}`,               inline: true }
    )
    .setTimestamp();
}
