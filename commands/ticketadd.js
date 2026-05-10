const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getTicketByChannel } = require('../utils/tickets');

module.exports = {
  name: 'ticketadd',

  data: new SlashCommandBuilder()
    .setName('ticketadd')
    .setDescription('Add a user to this ticket')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to add').setRequired(true)
    ),

  async execute(interaction) {
    const ticket = getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', flags: 64 });
    }

    const user = interaction.options.getUser('user');
    if (user.bot) return interaction.reply({ content: '❌ Cannot add a bot to a ticket.', flags: 64 });

    const existing = interaction.channel.permissionOverwrites.cache.get(user.id);
    if (existing?.allow.has(PermissionFlagsBits.ViewChannel)) {
      return interaction.reply({ content: `⚠️ ${user} already has access to this ticket.`, flags: 64 });
    }

    await interaction.channel.permissionOverwrites.create(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    await interaction.reply({ content: `✅ Added ${user} to this ticket.` });
  },

  async prefixExecute(message, args) {
    const ticket = getTicketByChannel(message.channel.id);
    if (!ticket) return message.reply('❌ This command can only be used inside a ticket channel.');

    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Usage: `!ticketadd @user`');
    if (user.bot) return message.reply('❌ Cannot add a bot to a ticket.');

    const existing = message.channel.permissionOverwrites.cache.get(user.id);
    if (existing?.allow.has(PermissionFlagsBits.ViewChannel)) {
      return message.reply(`⚠️ ${user} already has access to this ticket.`);
    }

    await message.channel.permissionOverwrites.create(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    await message.reply(`✅ Added ${user} to this ticket.`);
  }
};
