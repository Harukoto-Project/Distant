import { Event } from '../../lib/modules/Event';
import { moderateMessage } from '../../lib/modules/AdFilter';

export default new Event('messageUpdate', async (oldMessage, newMessage) => {
  try {
    // For partials, ensure we have full message
    const message = newMessage;
    // @ts-ignore
    const client = message.client;
    // Only moderate if content changed
    if (!oldMessage || !newMessage) return;
    // @ts-ignore
    if ((oldMessage.content || '') === (newMessage.content || '')) return;
    await moderateMessage(client, message as any);
  } catch (err) {
    console.error('messageUpdate moderation error:', err);
  }
});
