const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const NAMED_COLORS = {
  red: 0xed4245,
  green: 0x57f287,
  blue: 0x5865f2,
  yellow: 0xfee75c,
  orange: 0xe67e22,
  purple: 0x9b59b6,
  pink: 0xff73fa,
  white: 0xffffff,
  black: 0x000001,
  blurple: 0x5865f2,
  gold: 0xf1c40f,
  teal: 0x1abc9c,
  grey: 0x99aab5,
  gray: 0x99aab5
};

function resolveColor(input) {
  if (!input) return 0x5865f2;
  const lower = input.trim().toLowerCase();
  if (NAMED_COLORS[lower] !== undefined) return NAMED_COLORS[lower];
  const hex = lower.replace(/^#/, '');
  const parsed = parseInt(hex, 16);
  return isNaN(parsed) ? 0x5865f2 : parsed;
}

module.exports = {
  name: 'embedbuilder',

  data: new SlashCommandBuilder()
    .setName('embedbuilder')
    .setDescription('Build and send a custom embed to this channel')
    .addStringOption(opt =>
      opt.setName('title')
        .setDescription('Embed title')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('desc')
        .setDescription('Embed description (use \\n for new lines)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('color')
        .setDescription('Hex color (#ff0000) or name: red, green, blue, gold, purple…')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('footer')
        .setDescription('Footer text')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('thumbnail')
        .setDescription('Thumbnail image URL (top-right corner)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('image')
        .setDescription('Large image URL (bottom of embed)')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('timestamp')
        .setDescription('Show current timestamp in footer? (default: false)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const title     = interaction.options.getString('title');
    const desc      = interaction.options.getString('desc');
    const color     = interaction.options.getString('color');
    const footer    = interaction.options.getString('footer');
    const thumbnail = interaction.options.getString('thumbnail');
    const image     = interaction.options.getString('image');
    const timestamp = interaction.options.getBoolean('timestamp') ?? false;

    if (!title && !desc && !image) {
      return interaction.reply({
        content: '❌ Provide at least a **title**, **desc**, or **image** to build an embed.',
        flags: 64
      });
    }

    const embed = new EmbedBuilder().setColor(resolveColor(color));

    if (title) embed.setTitle(title);
    if (desc)  embed.setDescription(desc.replace(/\\n/g, '\n'));
    if (footer) embed.setFooter({ text: footer });
    if (thumbnail) {
      if (!isValidUrl(thumbnail)) {
        return interaction.reply({ content: '❌ **thumbnail** must be a valid URL.', flags: 64 });
      }
      embed.setThumbnail(thumbnail);
    }
    if (image) {
      if (!isValidUrl(image)) {
        return interaction.reply({ content: '❌ **image** must be a valid URL.', flags: 64 });
      }
      embed.setImage(image);
    }
    if (timestamp) embed.setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Embed sent!', flags: 64 });
  }
};

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
