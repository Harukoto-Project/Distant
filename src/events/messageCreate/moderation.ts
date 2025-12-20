import { Event } from '../../lib/modules/Event';
import { moderateMessage } from '../../lib/modules/AdFilter';

export default new Event('messageCreate', async (message) => {
  try {
    // lazy import client to avoid circulars if any
    // @ts-ignore
    const client = message.client;
    await moderateMessage(client, message as any);
  } catch (err) {
    console.error('messageCreate moderation error:', err);
  }
});
