const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

function buildServerEmbed(guild) {
  const totalMembers  = guild.memberCount;
  const botCount      = guild.members.cache.filter(m => m.user.bot).size;
  const humanCount    = totalMembers - botCount;

  const textChannels     = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
  const voiceChannels    = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
  const categoryChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;

  const verificationLevels = { 0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Very High' };
  const boostTiers         = { 0: 'No Tier', 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

  const owner = guild.members.cache.get(guild.ownerId);

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${DARROW} ${guild.name}`)
    .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: `${ARROW} Server ID`,    value: guild.id,                                                          inline: true },
      { name: `${ARROW} Owner`,        value: owner ? `${owner.user.tag}` : `<@${guild.ownerId}>`,               inline: true },
      { name: `${ARROW} Created`,      value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,              inline: true },
      { name: `${ARROW} Members`,      value: `${totalMembers} total • ${humanCount} humans • ${botCount} bots`, inline: false },
      { name: `${ARROW} Channels`,     value: `${textChannels} text • ${voiceChannels} voice • ${categoryChannels} categories`, inline: false },
      { name: `${ARROW} Roles`,        value: `${guild.roles.cache.size}`,                                       inline: true },
      { name: `${ARROW} Emojis`,       value: `${guild.emojis.cache.size}`,                                      inline: true },
      { name: `${ARROW} Verification`, value: verificationLevels[guild.verificationLevel] ?? 'Unknown',          inline: true },
      { name: `${ARROW} Boost Tier`,   value: boostTiers[guild.premiumTier] ?? 'None',                           inline: true },
      { name: `${ARROW} Boosts`,       value: `${guild.premiumSubscriptionCount ?? 0}`,                          inline: true }
    )
    .setFooter({ text: 'Server Info' })
    .setTimestamp();
}

module.exports = {
  name: 'serverinfo',

  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display information about this server'),

  async execute(interaction) {
    await interaction.reply({ embeds: [buildServerEmbed(interaction.guild)] });
  },

  async prefixExecute(message) {
    await message.reply({ embeds: [buildServerEmbed(message.guild)] });
  }
};
