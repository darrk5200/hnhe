const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarns } = require('../utils/database');

async function buildWarnsEmbed(warns, target, client) {
  const embed = new EmbedBuilder()
    .setColor(0xffaa00)
    .setTitle(`⚠️ Warnings for ${target.tag}`)
    .setFooter({ text: `Total warnings: ${warns.length}` })
    .setTimestamp();

  if (warns.length === 0) {
    embed.setDescription('This user has no warnings.');
  } else {
    const fields = await Promise.all(warns.map(async (warn, i) => {
      const mod = await client.users.fetch(warn.moderator_id).catch(() => null);
      const modName = mod ? mod.tag : `Unknown (${warn.moderator_id})`;
      const date = new Date(warn.timestamp).toUTCString();
      return {
        name: `Warning #${i + 1} — ${modName}`,
        value: `**Reason:** ${warn.reason}\n**Date:** ${date}`
      };
    }));
    embed.addFields(fields);
  }

  return embed;
}

module.exports = {
  name: 'checkwarns',

  data: new SlashCommandBuilder()
    .setName('checkwarns')
    .setDescription('Check the warnings for a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to check warnings for').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (!target) return interaction.reply({ content: 'User not found.', flags: 64 });

    const warns = getWarns(interaction.guild.id, target.id);
    const embed = await buildWarnsEmbed(warns, target, interaction.client);
    await interaction.reply({ embeds: [embed] });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply('You do not have permission to view warnings.');

    const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');

    const warns = getWarns(message.guild.id, target.id);
    const embed = await buildWarnsEmbed(warns, target, message.client);
    await message.reply({ embeds: [embed] });
  }
};
