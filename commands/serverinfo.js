const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

function buildServerEmbed(guild) {
  const totalMembers  = guild.memberCount;
  const botCount      = guild.members.cache.filter(m => m.user.bot).size;
  const humanCount    = totalMembers - botCount;

  const textChannels     = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
  const voiceChannels    = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
  const categoryChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;

  const verificationLevels = {
    0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Very High'
  };

  const boostTiers = {
    0: 'No Tier', 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3'
  };

  const owner = guild.members.cache.get(guild.ownerId);

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🏠 ${guild.name}`)
    .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: '🆔 Server ID',        value: guild.id,                                                           inline: true },
      { name: '👑 Owner',            value: owner ? `${owner.user.tag}` : `<@${guild.ownerId}>`,                inline: true },
      { name: '📅 Created',          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,               inline: true },
      { name: '👥 Members',          value: `${totalMembers} total • ${humanCount} humans • ${botCount} bots`,  inline: false },
      { name: '💬 Channels',         value: `${textChannels} text • ${voiceChannels} voice • ${categoryChannels} categories`, inline: false },
      { name: '🎭 Roles',            value: `${guild.roles.cache.size}`,                                        inline: true },
      { name: '😀 Emojis',           value: `${guild.emojis.cache.size}`,                                       inline: true },
      { name: '🔒 Verification',     value: verificationLevels[guild.verificationLevel] ?? 'Unknown',           inline: true },
      { name: '🚀 Boost Tier',       value: boostTiers[guild.premiumTier] ?? 'None',                            inline: true },
      { name: '✨ Boosts',           value: `${guild.premiumSubscriptionCount ?? 0}`,                           inline: true },
    )
    .setFooter({ text: `Server Info` })
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
