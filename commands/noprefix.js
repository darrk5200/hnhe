const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { hasNoPrefix, addNoPrefix, removeNoPrefix, listNoPrefix } = require('../utils/noprefix');

module.exports = {
  name: 'noprefix',

  data: new SlashCommandBuilder()
    .setName('noprefix')
    .setDescription('Grant or revoke prefix-free command access (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Grant a user prefix-free access')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to grant access').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Revoke prefix-free access from a user')
        .addUserOption(opt =>
          opt.setName('user').setDescription('User to revoke').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all users with prefix-free access')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      if (user.bot) return interaction.reply({ content: '❌ Cannot grant noprefix to a bot.', flags: 64 });
      if (hasNoPrefix(interaction.guildId, user.id)) {
        return interaction.reply({ content: `⚠️ ${user} already has prefix-free access.`, flags: 64 });
      }
      addNoPrefix(interaction.guildId, user.id);
      return interaction.reply({ content: `✅ ${user} can now use commands without the prefix.`, flags: 64 });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      if (!hasNoPrefix(interaction.guildId, user.id)) {
        return interaction.reply({ content: `⚠️ ${user} does not have prefix-free access.`, flags: 64 });
      }
      removeNoPrefix(interaction.guildId, user.id);
      return interaction.reply({ content: `✅ Removed prefix-free access from ${user}.`, flags: 64 });
    }

    if (sub === 'list') {
      const ids = listNoPrefix(interaction.guildId);
      if (!ids.length) {
        return interaction.reply({ content: '📋 No users currently have prefix-free access.', flags: 64 });
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📋 Prefix-Free Users')
        .setDescription(ids.map(id => `<@${id}>`).join('\n'))
        .setFooter({ text: `${ids.length} user${ids.length !== 1 ? 's' : ''}` })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], flags: 64 });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission to use this command.');
    }

    const sub = args[0]?.toLowerCase();
    const mentioned = message.mentions.users.first();

    if (sub === 'add') {
      if (!mentioned) return message.reply('❌ Usage: `!noprefix add @user`');
      if (mentioned.bot) return message.reply('❌ Cannot grant noprefix to a bot.');
      if (hasNoPrefix(message.guildId, mentioned.id)) {
        return message.reply(`⚠️ ${mentioned} already has prefix-free access.`);
      }
      addNoPrefix(message.guildId, mentioned.id);
      return message.reply(`✅ ${mentioned} can now use commands without the prefix.`);
    }

    if (sub === 'remove') {
      if (!mentioned) return message.reply('❌ Usage: `!noprefix remove @user`');
      if (!hasNoPrefix(message.guildId, mentioned.id)) {
        return message.reply(`⚠️ ${mentioned} does not have prefix-free access.`);
      }
      removeNoPrefix(message.guildId, mentioned.id);
      return message.reply(`✅ Removed prefix-free access from ${mentioned}.`);
    }

    if (sub === 'list') {
      const ids = listNoPrefix(message.guildId);
      if (!ids.length) return message.reply('📋 No users currently have prefix-free access.');
      return message.reply(`📋 **Prefix-free users:**\n${ids.map(id => `<@${id}>`).join('\n')}`);
    }

    return message.reply('❌ Usage: `!noprefix <add|remove|list> [@user]`');
  }
};
