import express from 'express';
import type { Client } from 'discord.js';
import createSharedRouter from './users/[userId]/shared';

export function startApi(client: Client, port = Number(process.env.API_PORT) || 3000) {
  const app = express();
  app.use(express.json());

  function checkApiKey(req: express.Request) {
    const configured = process.env.API_KEY;
    if (!configured) return false;
    const key = (req.headers['x-api-key'] as string) || req.body?.apiKey || (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    return key === configured;
  }

  // Mount per-user shared API router (uses existing src/api/users/[userId]/shared)
  app.use('/users/:userId/shared', (req, _res, next) => {
    // attach the userId param into req for the router if needed, then delegate
    next();
  });
  app.use('/users/:userId/shared', createSharedRouter(client));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${port}`);
  });

  return server;
}

export default startApi;
