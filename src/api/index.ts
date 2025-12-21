import express from 'express';
import type { Client } from 'discord.js';
import { mountRouters } from './loader';

export function startApi(
  client: Client,
  port = Number(process.env.API_PORT) || 3000,
) {
  const app = express();
  app.use(express.json());

  mountRouters(app, client, __dirname);

  app.get('/health', (_req, res) => res.json({ ok: true }));

  const server = app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });

  return server;
}

export default startApi;
