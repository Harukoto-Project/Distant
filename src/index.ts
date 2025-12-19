import { GatewayIntentBits, Partials } from 'discord.js';
import { Distant } from './lib/modules/Distant';
import dotenv from 'dotenv';
import I18n from './lib/modules/I18n';

dotenv.config();

const i18n = new I18n(process.env.LANG || 'ja');

const ws = require('@discordjs/ws');
const identifyProperties =
  ws && ws.DefaultWebSocketManagerOptions && ws.DefaultWebSocketManagerOptions.identifyProperties;
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
  })
  .catch((error) => {
    console.error(i18n.t('error.startup', { error: String(error) }));
    process.exit(1);
  });
