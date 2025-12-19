import { GatewayIntentBits } from 'discord.js';
import { Distant } from './lib/modules/Distant';
import dotenv from 'dotenv';

dotenv.config();

export const client = new Distant(
  {
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  },
  {
    token: process.env.CLIENT_TOKEN!,
    debugMode: process.env.SYSTEM_DEBUG_MODE === 'true',
    developerIds: process.env.DEVELOPER_IDS!.split(','),
  },
);

client
  .start()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .then(() => {
    console.log('Bot is ready');
  });
