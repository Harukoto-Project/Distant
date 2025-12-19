import express from 'express';
import type { Client } from 'discord.js';
import createSharedRouter from '../api/users/[userId]/shared';

export function startApp(
  client: Client,
  port = Number(process.env.API_PORT) || 3000,
) {
  const app = express();
  app.use(express.json());

  app.use('/api/users/:userId/shared', createSharedRouter(client));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  const server = app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });

  return server;
}

export default startApp;
