import express from 'express';
import type { Client } from 'discord.js';
import { ChannelType } from 'discord.js';
import { apiKeyAuth } from '../../../middleware/auth';

type Params = { guildId: string };

export default function createChannelsRouter(client: Client) {
  const router = express.Router({ mergeParams: true });

  router.use(apiKeyAuth);

  router.get('/', async (req: express.Request<Params>, res) => {
    const { guildId } = req.params;
    const typeFilter = (req.query.type as string) || 'text';

    if (!guildId) {
      return res.status(400).json({ error: 'missing_guild_id' });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'guild_not_found' });
    }

    try {
      const allChannels = Array.from(guild.channels.cache.values());

      const filteredChannels = allChannels.filter((channel) => {
        if (typeFilter === 'all') return true;
        if (typeFilter === 'text') {
          return (
            channel.type === ChannelType.GuildText ||
            channel.type === ChannelType.GuildAnnouncement
          );
        }
        if (typeFilter === 'voice') {
          return (
            channel.type === ChannelType.GuildVoice ||
            channel.type === ChannelType.GuildStageVoice
          );
        }
        if (typeFilter === 'category') {
          return channel.type === ChannelType.GuildCategory;
        }
        return false;
      });

      const channels = filteredChannels
        .sort((a, b) => {
          const posA = 'position' in a ? a.position : 0;
          const posB = 'position' in b ? b.position : 0;
          return posA - posB;
        })
        .map((channel) => {
          const parent = 'parent' in channel ? channel.parent : null;
          return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            position: 'position' in channel ? channel.position : 0,
            parent_id: parent?.id || null,
            parent_name: parent?.name || null,
          };
        });

      return res.json({ channels });
    } catch (err) {
      console.error('Failed to get channels:', err);
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}
