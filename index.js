const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Collections for commands
client.commands = new Collection();
client.prefixCommands = new Collection();

// Load slash commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) {
    client.commands.set(command.data.name, command);
  }
  if (command.prefixExecute) {
    client.prefixCommands.set(command.name || command.data?.name, command);
  }
}

// Event: Bot ready
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log(`📁 Loaded ${client.commands.size} slash commands`);
  console.log(`📁 Loaded ${client.prefixCommands.size} prefix commands`);
  console.log(`🔧 Prefix: ${config.prefix}`);
});

// Event: Slash command interaction
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error executing this command!',
      ephemeral: true
    });
  }
});

// Event: Prefix command handler
client.on(Events.MessageCreate, async message => {
  // Ignore bot messages and DMs
  if (message.author.bot) return;
  if (!message.guild) return;

  // Check for prefix
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.prefixExecute(message, args);
  } catch (error) {
    console.error(error);
    await message.reply('There was an error executing this command!');
  }
});

// Login
client.login(process.env.token);
