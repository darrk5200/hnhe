const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';

module.exports = {
  name: 'ticket',

  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Post the ticket panel in this channel')
    .addStringOption(opt =>
      opt.setName('message').setDescription('Message to display in the ticket embed').setRequired(true)
    )
    .addBooleanOption(opt =>
      opt.setName('support_btn').setDescription('Enable Support button (default: true)').setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('reward_btn').setDescription('Enable Reward button (default: true)').setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('others_btn').setDescription('Enable Others button (default: true)').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const message       = interaction.options.getString('message');
    const supportEnabled = interaction.options.getBoolean('support_btn') ?? true;
    const rewardEnabled  = interaction.options.getBoolean('reward_btn')  ?? true;
    const othersEnabled  = interaction.options.getBoolean('others_btn')  ?? true;

    if (!supportEnabled && !rewardEnabled && !othersEnabled)
      return interaction.reply({ content: '❌ At least one button must be enabled.', flags: 64 });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${DARROW} Open a Ticket`)
      .setDescription(message)
      .setFooter({ text: 'Click a button below to open a ticket' })
      .setTimestamp();

    const buttons = [];
    if (supportEnabled) buttons.push(new ButtonBuilder().setCustomId('ticket_support').setLabel('Support').setStyle(ButtonStyle.Primary).setEmoji('🛠️'));
    if (rewardEnabled)  buttons.push(new ButtonBuilder().setCustomId('ticket_reward').setLabel('Reward').setStyle(ButtonStyle.Success).setEmoji('🎁'));
    if (othersEnabled)  buttons.push(new ButtonBuilder().setCustomId('ticket_others').setLabel('Others').setStyle(ButtonStyle.Secondary).setEmoji('💬'));

    const row = new ActionRowBuilder().addComponents(buttons);
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Ticket panel posted!', flags: 64 });
  }
};
