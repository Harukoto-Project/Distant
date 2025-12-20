import { Event } from '../../lib/modules/Event';
import { moderateMessage } from '../../lib/modules/AdFilter';

export default new Event('messageUpdate', async (oldMessage, newMessage) => {
  try {
    const message = newMessage;
    const client = message.client;
    if (!oldMessage || !newMessage) return;
    if ((oldMessage.content || '') === (newMessage.content || '')) return;
    await moderateMessage(client, message as any);
  } catch (err) {
    console.error('messageUpdate moderation error:', err);
  }
});
