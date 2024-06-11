import { REST, Routes } from 'discord.js';
import 'dotenv/config';
const commands = [
    {
      name: 'ping',
      description: 'Replies with Pong!',
    },
    {
        name:"generateqr",
        description:"Creates Qr code for given text",
        options: [
            {
                name: 'input',
                description: 'The text to generate QR code for',
                type: 3,
                required: true,
            },
        ],
        
    },
    {
      name: "generatebulkqr",
      description: "Upload a file with text/ID data to generate multiple qr codes",
      options: [
        {
            name: 'file',
            description: 'Upload a file (spreadsheet, text, etc.)',
            type: 11, // For channel uploads
            required: true,
        }
    ],
    },
    {
      name:"generatevcardqr",
      description:"Get your personlised vcard qr code",
    }
  ];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);


try {
    console.log('Started refreshing application (/) commands.');
  
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }