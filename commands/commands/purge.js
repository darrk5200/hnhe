const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'purge',

  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk-delete messages in this channel')
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (1–100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Only delete messages from this user (optional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    const fetched = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!fetched) {
      return interaction.editReply('❌ Could not fetch messages.');
    }

    let toDelete = [...fetched.values()];

    // Filter by user if specified
    if (targetUser) {
      toDelete = toDelete.filter(m => m.author.id === targetUser.id);
    }

    // bulkDelete only works on messages < 14 days old
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    toDelete = toDelete.filter(m => m.createdTimestamp > twoWeeksAgo);

    toDelete = toDelete.slice(0, amount);

    if (toDelete.length === 0) {
      return interaction.editReply(
        targetUser
          ? `❌ No recent messages from ${targetUser.tag} found (messages must be under 14 days old).`
          : '❌ No messages to delete (messages must be under 14 days old).'
      );
    }

    const deleted = await interaction.channel.bulkDelete(toDelete, true).catch(err => {
      console.error('[Purge] bulkDelete error:', err.message);
      return null;
    });

    if (!deleted) {
      return interaction.editReply('❌ Failed to delete messages. Make sure I have **Manage Messages** permission.');
    }

    const count = deleted.size;
    const reply = targetUser
      ? `✅ Deleted **${count}** message${count !== 1 ? 's' : ''} from **${targetUser.tag}**.`
      : `✅ Deleted **${count}** message${count !== 1 ? 's' : ''}.`;

    await interaction.editReply(reply);
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You need **Manage Messages** permission.');
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('❌ Usage: `!purge <1-100> [@user]`');
    }

    const targetUser = message.mentions.users.first() || null;

    // Delete the command message itself first
    await message.delete().catch(() => {});

    const fetched = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!fetched) return message.channel.send('❌ Could not fetch messages.').then(m => setTimeout(() => m.delete().catch(() => {}), 5000));

    let toDelete = [...fetched.values()];
    if (targetUser) toDelete = toDelete.filter(m => m.author.id === targetUser.id);

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    toDelete = toDelete.filter(m => m.createdTimestamp > twoWeeksAgo);
    toDelete = toDelete.slice(0, amount);

    if (toDelete.length === 0) {
      return message.channel.send('❌ No eligible messages found (must be under 14 days old).')
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const deleted = await message.channel.bulkDelete(toDelete, true).catch(() => null);
    const count = deleted?.size ?? 0;

    const reply = targetUser
      ? `✅ Deleted **${count}** message${count !== 1 ? 's' : ''} from **${targetUser.tag}**.`
      : `✅ Deleted **${count}** message${count !== 1 ? 's' : ''}.`;

    message.channel.send(reply).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
  }
};
