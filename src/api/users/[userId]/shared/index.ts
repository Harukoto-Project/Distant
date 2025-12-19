import express from 'express';
import type { Client } from 'discord.js';

function checkApiKey(req: express.Request) {
	const configured = process.env.API_KEY;
	if (!configured) return false;
	const key = (req.headers['x-api-key'] as string) || req.body?.apiKey || (req.headers.authorization || '').replace(/^Bearer\s+/, '');
	return key === configured;
}

export default function createSharedRouter(client: Client) {
	const router = express.Router({ mergeParams: true });

	// POST /users/:userId/shared
	router.post('/', async (req: express.Request<{ userId: string }>, res) => {
		try {
			if (!checkApiKey(req)) return res.status(401).json({ error: 'invalid_api_key' });

			const userId = req.params.userId;
			const { guildId } = req.body || {};
			if (!userId || !guildId) return res.status(400).json({ error: 'missing_parameters' });

			const targetGuild = client.guilds.cache.get(guildId);
			if (!targetGuild) return res.status(404).json({ error: 'guild_not_found' });

			// Verify the user is in the provided guild
			try {
				await targetGuild.members.fetch(userId);
			} catch (e) {
				return res.status(404).json({ error: 'user_not_in_guild' });
			}

			const mutual: string[] = [];
			const guilds = Array.from(client.guilds.cache.values());
			for (const g of guilds) {
				try {
					const m = await g.members.fetch(userId).catch(() => null);
					if (m) mutual.push(g.id);
				} catch (e) {
					// ignore
				}
			}

			return res.json({ mutualGuilds: mutual });
		} catch (err) {
			return res.status(500).json({ error: 'internal_error' });
		}
	});

	return router;
}

