const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('./config');

async function handleWelcome(member) {
  const config = getConfig();
  if (!config.welcomeMessageEnabled) return;

  const channelId = config.welcomeChannelId;
  if (!channelId || channelId === 'YOUR_WELCOME_CHANNEL_ID_HERE') return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const memberCount = member.guild.memberCount;

  const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
  const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`${DARROW} Welcome to ${member.guild.name}!`)
    .setDescription(`Hey ${member}, glad to have you here!\nYou are member **#${memberCount}**.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: `${ARROW} Account Created`, value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: `${ARROW} Members`,         value: `${memberCount}`,                                           inline: true }
    )
    .setFooter({ text: `ID: ${member.id}` })
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(err => {
    console.error('[Welcome] Failed to send welcome message:', err.message);
  });
}

async function handleLeave(member) {
  const config = getConfig();
  if (!config.leaveMessageEnabled) return;

  const channelId = config.leaveChannelId;
  if (!channelId || channelId === 'YOUR_LEAVE_CHANNEL_ID_HERE') return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const memberCount = member.guild.memberCount;

  const DARROW = '<a:hnblue_ARROW:1502946449544187906>';
  const ARROW  = '<a:hnblue_arrow:1502946479801765969>';

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`${DARROW} Goodbye, ${member.user.tag}`)
    .setDescription(`**${member.user.tag}** has left the server.\nWe now have **${memberCount}** members.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: `${ARROW} Joined`,  value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
      { name: `${ARROW} Members`, value: `${memberCount}`,                                                                           inline: true }
    )
    .setFooter({ text: `ID: ${member.id}` })
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(err => {
    console.error('[Leave] Failed to send leave message:', err.message);
  });
}

module.exports = { handleWelcome, handleLeave };
