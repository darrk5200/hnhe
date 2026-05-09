const { getConfig } = require('./config');

async function sendModLog(client, embed) {
  const config = getConfig();
  const channelId = config.modLogChannelId;
  if (!channelId || channelId === 'YOUR_MOD_LOG_CHANNEL_ID_HERE') return;

  const channel = client.channels.cache.get(channelId);
  if (!channel) return;

  await channel.send({ embeds: [embed] }).catch(err => {
    console.error('[ModLog] Failed to send mod log:', err.message);
  });
}

module.exports = { sendModLog };
