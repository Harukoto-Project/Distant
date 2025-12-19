import express from 'express';
import type { Client } from 'discord.js';

type Params = { userId: string };

export default function createSharedRouter(client: Client) {
  const router = express.Router({ mergeParams: true });

  async function findMutualGuildIds(userId: string): Promise<string[]> {
    const guilds = Array.from(client.guilds.cache.values());
    const checks = guilds.map((g) =>
      g.members.fetch(userId).then(() => g.id).catch(() => null),
    );
    const results = await Promise.allSettled(checks);
    return results
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter(Boolean) as string[];
  }

  router.post('/', async (req: express.Request<Params>, res) => {
    const userId = req.params.userId;
    const { guildId } = req.body || {};
    if (!userId || !guildId) return res.status(400).json({ error: 'missing_parameters' });

    const targetGuild = client.guilds.cache.get(guildId);
    if (!targetGuild) return res.status(404).json({ error: 'guild_not_found' });

    try {
      await targetGuild.members.fetch(userId);
    } catch {
      return res.status(404).json({ error: 'user_not_in_guild' });
    }

    try {
      const mutual = await findMutualGuildIds(userId);
      return res.json({ mutualGuilds: mutual });
    } catch {
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}
