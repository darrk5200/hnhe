const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType
} = require('discord.js');

const DOT        = '<a:hnDot:1502946446557708308>';
const E_MOD      = '<:hnhelpermoderation:1502951368552611875>';
const E_WELCOME  = '<a:hnhelperwel:1502951366040223797>';
const E_INVITE   = '<:hnhelperinvite:1502951364723085402>';
const E_LEVELS   = '<a:hnhelperSTAR:1502951358746071070>';
const E_TICKETS  = '<a:hnhelpertickets:1502951360121929749>';
const E_UTILITY  = '<a:hnhelpercome:1502951367449378899>';
const LOGO       = '<a:hnlogo:1502951371396092015>';

const CATEGORIES = {
  moderation: {
    label: 'Moderation',
    emoji: E_MOD,
    description: 'Ban, kick, warn, and manage members',
    commands: [
      { name: 'ban',                       desc: 'Ban a member from the server' },
      { name: 'kick',                      desc: 'Kick a member from the server' },
      { name: 'timeout',                   desc: 'Timeout a member' },
      { name: 'warn',                      desc: 'Warn a member' },
      { name: 'checkwarns',               desc: "View a member's warnings" },
      { name: 'clearwarn',                desc: "Clear a member's warnings" },
      { name: 'addrole',                   desc: 'Add a role to a member' },
      { name: 'removerole',               desc: 'Remove a role from a member' },
      { name: 'lock',                      desc: 'Lock a channel' },
      { name: 'unlock',                    desc: 'Unlock a channel' },
      { name: 'snipe',                     desc: 'Show last deleted message' },
      { name: 'purge <amount> [@user]',   desc: 'Bulk-delete messages' },
      { name: 'setmodlog channel',         desc: 'Set the mod log channel (Admin)' },
      { name: 'setmodlog disable',         desc: 'Disable mod logging (Admin)' }
    ]
  },
  welcome: {
    label: 'Welcome & Leave',
    emoji: E_WELCOME,
    description: 'Configure welcome and leave messages',
    commands: [
      { name: 'setwelcome channel', desc: 'Set the welcome channel' },
      { name: 'setwelcome toggle',  desc: 'Enable/disable welcome messages' },
      { name: 'setleave channel',   desc: 'Set the leave channel' },
      { name: 'setleave toggle',    desc: 'Enable/disable leave messages' }
    ]
  },
  invites: {
    label: 'Invite Tracker',
    emoji: E_INVITE,
    description: 'Track invites and view leaderboards',
    commands: [
      { name: 'invites [@user]',     desc: 'View invite stats for a user' },
      { name: 'leaderboard invites', desc: 'Top 10 members by invites' }
    ]
  },
  levels: {
    label: 'Levels',
    emoji: E_LEVELS,
    description: 'XP system and level leaderboard',
    commands: [
      { name: 'level [@user]',      desc: "Check your or another user's level" },
      { name: 'leaderboard levels', desc: 'Top 10 members by level' }
    ]
  },
  tickets: {
    label: 'Tickets',
    emoji: E_TICKETS,
    description: 'Ticket panel and logging setup',
    commands: [
      { name: 'ticket',               desc: 'Post a ticket panel (Admin)' },
      { name: 'setticketlog channel', desc: 'Set the ticket log channel (Admin)' },
      { name: 'setticketlog disable', desc: 'Disable ticket logging (Admin)' }
    ]
  },
  utility: {
    label: 'Utility',
    emoji: E_UTILITY,
    description: 'General utility commands',
    commands: [
      { name: 'ping',         desc: 'Check the bot latency' },
      { name: 'serverinfo',   desc: 'View server information' },
      { name: 'roleinfo',     desc: 'View role information' },
      { name: 'embedbuilder', desc: 'Build a custom embed' }
    ]
  }
};

function buildOverviewEmbed(client) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${LOGO} ${client.user.username}`)
    .setDescription(
      `${DOT} Select a category from the dropdown below to view its commands.\nUse \`/command\` for slash commands or \`!command\` for prefix commands.`
    )
    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 128 }))
    .addFields(
      Object.values(CATEGORIES).map(cat => ({
        name: `${cat.emoji} ${cat.label}`,
        value: cat.description,
        inline: true
      }))
    )
    .setFooter({ text: `${client.user.username} • Select a category below` })
    .setTimestamp();
}

function buildCategoryEmbed(client, key) {
  const cat = CATEGORIES[key];
  const lines = cat.commands.map(c => `\`${c.name}\` — ${c.desc}`).join('\n');
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${cat.emoji} ${cat.label} Commands`)
    .setDescription(lines)
    .setFooter({ text: `${client.user.username} • Use the dropdown to switch categories` })
    .setTimestamp();
}

function buildMenu(placeholder) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder(placeholder)
    .addOptions(
      Object.entries(CATEGORIES).map(([key, cat]) => {
        const emojiStr = cat.emoji;
        const match = emojiStr.match(/^<(a?):(\w+):(\d+)>$/);
        const emojiObj = match
          ? { id: match[3], name: match[2], animated: match[1] === 'a' }
          : { name: emojiStr };

        return new StringSelectMenuOptionBuilder()
          .setLabel(cat.label)
          .setDescription(cat.description)
          .setValue(key)
          .setEmoji(emojiObj);
      })
    );
  return new ActionRowBuilder().addComponents(menu);
}

async function runHelpMenu(client, reply, userId) {
  const filter = i => i.customId === 'help_category' && i.user.id === userId;

  while (true) {
    let selectInteraction;
    try {
      selectInteraction = await reply.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 120_000
      });
    } catch {
      const disabledMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category_expired')
        .setPlaceholder('Session expired — run !help again')
        .setDisabled(true)
        .addOptions(new StringSelectMenuOptionBuilder().setLabel('Expired').setValue('expired'));
      await reply.edit({ components: [new ActionRowBuilder().addComponents(disabledMenu)] }).catch(() => {});
      break;
    }

    const key = selectInteraction.values[0];
    await selectInteraction.update({
      embeds: [buildCategoryEmbed(client, key)],
      components: [buildMenu(`Viewing: ${CATEGORIES[key].label}`)]
    });
  }
}

module.exports = {
  name: 'help',

  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  async execute(interaction) {
    await interaction.reply({
      embeds: [buildOverviewEmbed(interaction.client)],
      components: [buildMenu('Choose a category...')]
    });
    const reply = await interaction.fetchReply();
    await runHelpMenu(interaction.client, reply, interaction.user.id);
  },

  async prefixExecute(message) {
    const reply = await message.reply({
      embeds: [buildOverviewEmbed(message.client)],
      components: [buildMenu('Choose a category...')]
    });
    await runHelpMenu(message.client, reply, message.author.id);
  }
};
