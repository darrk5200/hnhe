const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { sendModLog } = require('../utils/modLog');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

module.exports = {
  name: 'removerole',

  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Remove a role from a member')
    .addUserOption(opt => opt.setName('user').setDescription('The user to remove the role from').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const role   = interaction.options.getRole('role');

    if (!target) return interaction.reply({ content: 'User not found in this server.', flags: 64 });
    if (role.position >= interaction.guild.members.me.roles.highest.position)
      return interaction.reply({ content: 'I cannot remove a role higher than or equal to my highest role.', flags: 64 });
    if (!target.roles.cache.has(role.id))
      return interaction.reply({ content: `${target.user.tag} does not have that role.`, flags: 64 });

    await target.roles.remove(role);
    const embed = buildEmbed(target.user.tag, target.id, role.name, interaction.user.tag);
    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, embed);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
      return message.reply('You do not have permission to manage roles.');

    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply('Please mention a valid user or provide their ID.');

    const role = message.mentions.roles.first() ||
      message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(message.mentions.members.first() ? 1 : 2).join(' ').toLowerCase()) ||
      message.guild.roles.cache.get(args[message.mentions.members.first() ? 1 : 2]);

    if (!role) return message.reply('Please mention a valid role or provide its name/ID.');
    if (role.position >= message.guild.members.me.roles.highest.position)
      return message.reply('I cannot remove a role higher than or equal to my highest role.');
    if (!target.roles.cache.has(role.id)) return message.reply(`${target.user.tag} does not have that role.`);

    await target.roles.remove(role);
    const embed = buildEmbed(target.user.tag, target.id, role.name, message.author.tag);
    await message.reply({ embeds: [embed] });
    await sendModLog(message.client, embed);
  }
};

function buildEmbed(userTag, userId, roleName, modTag) {
  return new EmbedBuilder()
    .setColor(0xff4444)
    .setTitle(`${DARROW} Role Removed`)
    .addFields(
      { name: `${ARROW} User`,      value: `${userTag} (${userId})`, inline: true },
      { name: `${ARROW} Role`,      value: roleName,                 inline: true },
      { name: `${ARROW} Moderator`, value: modTag,                   inline: true }
    )
    .setTimestamp();
}
