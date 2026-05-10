const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getTicketByChannel } = require('../utils/tickets');

module.exports = {
  name: 'ticketremove',

  data: new SlashCommandBuilder()
    .setName('ticketremove')
    .setDescription('Remove a user from this ticket')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to remove').setRequired(true)
    ),

  async execute(interaction) {
    const ticket = getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', flags: 64 });
    }

    const user = interaction.options.getUser('user');

    // Prevent removing the ticket owner
    if (user.id === ticket.user_id) {
      return interaction.reply({ content: '❌ You cannot remove the ticket owner.', flags: 64 });
    }

    // Prevent removing the bot itself
    if (user.id === interaction.client.user.id) {
      return interaction.reply({ content: '❌ Cannot remove the bot from its own ticket.', flags: 64 });
    }

    const existing = interaction.channel.permissionOverwrites.cache.get(user.id);
    if (!existing) {
      return interaction.reply({ content: `⚠️ ${user} does not have explicit access to this ticket.`, flags: 64 });
    }

    await interaction.channel.permissionOverwrites.delete(user);
    await interaction.reply({ content: `✅ Removed ${user} from this ticket.` });
  },

  async prefixExecute(message, args) {
    const ticket = getTicketByChannel(message.channel.id);
    if (!ticket) return message.reply('❌ This command can only be used inside a ticket channel.');

    const user = message.mentions.users.first();
    if (!user) return message.reply('❌ Usage: `!ticketremove @user`');

    if (user.id === ticket.user_id) {
      return message.reply('❌ You cannot remove the ticket owner.');
    }

    if (user.id === message.client.user.id) {
      return message.reply('❌ Cannot remove the bot from its own ticket.');
    }

    const existing = message.channel.permissionOverwrites.cache.get(user.id);
    if (!existing) {
      return message.reply(`⚠️ ${user} does not have explicit access to this ticket.`);
    }

    await message.channel.permissionOverwrites.delete(user);
    await message.reply(`✅ Removed ${user} from this ticket.`);
  }
};
