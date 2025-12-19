import { Event } from '../../lib/modules/Event';

export default new Event('ready', (client) => {
  console.log(`Logged in as ${client.user?.tag}`);
});
