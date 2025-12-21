import { Event } from '../../lib/modules/Event';
import { moderateMessage } from '../../lib/modules/AdFilter';

export default new Event('messageCreate', async (message) => {
  try {
    const client = message.client;
    await moderateMessage(client, message as any);
  } catch (err) {
    console.error('messageCreate moderation error:', err);
  }
});