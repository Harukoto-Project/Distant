import express from 'express';
import type { Client } from 'discord.js';
import Database from '../../../../../lib/modules/Database';
import { sendAnchor, removeAnchor } from '../../../../../lib/modules/AdFilter';
import { apiKeyAuth } from '../../../../middleware/auth';

type Params = { guildId: string };

const db = new Database();

export default function createAdFilterRouter(client: Client) {
  const router = express.Router({ mergeParams: true });

  router.use(apiKeyAuth);

  router.post('/', async (req: express.Request<Params>, res) => {
    const { guildId } = req.params;
    if (!guildId) {
      return res.status(400).json({ error: 'missing_guild_id' });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'guild_not_found' });
    }

    try {
      await db.init();
      const config = await db.getAdFilter(guildId);

      if (!config) {
        try {
          await removeAnchor(client, guildId);
        } catch (e) {}
        return res.json({ success: true, action: 'removed' });
      }

      const channel = guild.channels.cache.get(config.channel_id);
      if (!channel || !channel.isTextBased()) {
        return res.status(400).json({ error: 'invalid_channel_id' });
      }

      try {
        await sendAnchor(client, guildId, config.channel_id);
      } catch (e) {
        console.error('Failed to send anchor:', e);
        return res.status(500).json({ error: 'failed_to_send_anchor' });
      }

      return res.json({
        success: true,
        action: 'updated',
        channel_id: config.channel_id,
        log_channel_id: config.log_channel_id || null,
      });
    } catch (err) {
      console.error('Failed to process ad_filter update:', err);
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}
