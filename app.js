import { Client, Events, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { 
  handleGenerateQRCommand,
  handleGenerateBulkQRCommand,
  handleGenerateVcardQRCommand,
  handleVcardModal 
} from './commands/qrCommand.js';


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    
  ],
});

client.on(Events.InteractionCreate,async (interaction)=>{
  if (!interaction.isModalSubmit()) return;
	await handleGenerateVcardQRCommand(interaction)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  switch (interaction.commandName) {
    case 'generateqr':
      await handleGenerateQRCommand(interaction);
      break;
    case 'generatebulkqr':
      await handleGenerateBulkQRCommand(interaction);
      break;
    case 'generatevcardqr':
      await handleVcardModal(interaction)
      break;
    default:
      break;
  }

});


client.login(process.env.DISCORD_TOKEN);
