const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

const KEY_PERMISSIONS = [
  ['Administrator',   'Administrator'],
  ['ManageGuild',     'Manage Server'],
  ['ManageRoles',     'Manage Roles'],
  ['ManageChannels',  'Manage Channels'],
  ['ManageMessages',  'Manage Messages'],
  ['ManageNicknames', 'Manage Nicknames'],
  ['KickMembers',     'Kick Members'],
  ['BanMembers',      'Ban Members'],
  ['MentionEveryone', 'Mention Everyone'],
  ['ModerateMembers', 'Timeout Members'],
];

function buildRoleEmbed(role, guild) {
  const memberCount = guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;
  const hexColor = role.hexColor === '#000000' ? 'None' : role.hexColor.toUpperCase();
  const perms = KEY_PERMISSIONS
    .filter(([flag]) => role.permissions.has(PermissionsBitField.Flags[flag]))
    .map(([, label]) => label);

  return new EmbedBuilder()
    .setColor(role.color || 0x5865f2)
    .setTitle(`${DARROW} Role — ${role.name}`)
    .addFields(
      { name: `${ARROW} Role ID`,      value: role.id,                                             inline: true },
      { name: `${ARROW} Color`,        value: hexColor,                                             inline: true },
      { name: `${ARROW} Created`,      value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
      { name: `${ARROW} Members`,      value: `${memberCount}`,                                     inline: true },
      { name: `${ARROW} Position`,     value: `${role.position}`,                                   inline: true },
      { name: `${ARROW} Mentionable`,  value: role.mentionable ? 'Yes' : 'No',                     inline: true },
      { name: `${ARROW} Hoisted`,      value: role.hoist ? 'Yes' : 'No',                           inline: true },
      { name: `${ARROW} Managed`,      value: role.managed ? 'Yes (bot/integration)' : 'No',       inline: true },
      { name: `${ARROW} Key Permissions`, value: perms.length > 0 ? perms.join(', ') : 'None',    inline: false }
    )
    .setFooter({ text: 'Role Info' })
    .setTimestamp();
}

module.exports = {
  name: 'roleinfo',

  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Display information about a role')
    .addRoleOption(opt =>
      opt.setName('role').setDescription('The role to inspect').setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    await interaction.reply({ embeds: [buildRoleEmbed(role, interaction.guild)] });
  },

  async prefixExecute(message, args) {
    const role =
      message.mentions.roles.first() ||
      (args[0] ? message.guild.roles.cache.find(r => r.id === args[0] || r.name.toLowerCase() === args.join(' ').toLowerCase()) : null);

    if (!role) return message.reply('Please mention a role or provide a role name/ID.');
    await message.reply({ embeds: [buildRoleEmbed(role, message.guild)] });
  }
};
