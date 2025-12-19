import { GatewayIntentBits, Partials } from 'discord.js';
import { Distant } from './lib/modules/Distant';
import dotenv from 'dotenv';
import { getI18n } from './lib/modules/i18nInstance';
import startApp from './app';
import Database from './lib/modules/Database';

dotenv.config();

const i18n = getI18n();

const ws = require('@discordjs/ws');
const identifyProperties =
  ws &&
  ws.DefaultWebSocketManagerOptions &&
  ws.DefaultWebSocketManagerOptions.identifyProperties;
if (identifyProperties) identifyProperties.browser = 'Discord Android';

export const client = new Distant(
  {
    intents: Object.values(GatewayIntentBits).filter(
      (v): v is GatewayIntentBits => typeof v === 'number',
    ),
    partials: Object.values(Partials) as Partials[],
  },
  {
    token: process.env.CLIENT_TOKEN!,
    debugMode: process.env.SYSTEM_DEBUG_MODE === 'true',
    developerIds: process.env.DEVELOPER_IDS!.split(','),
  },
);

client
  .start()
  .then(() => {
    console.log(i18n.t('ready.message'));
    try {
      const db = new Database();
      db.init().catch(() => {});
      startApp(client);
    } catch (e) {
      console.error('Failed to start API', e);
    }
  })
  .catch((error) => {
    console.error(i18n.t('error.startup', { error: String(error) }));
    process.exit(1);
  });
