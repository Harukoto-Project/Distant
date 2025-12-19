import path from 'path';
import glob from 'glob';
import type { Client } from 'discord.js';
import type express from 'express';
import { apiKeyAuth } from './middleware/auth';

export function mountRouters(app: express.Application, client: Client, baseDir = __dirname) {
  const pattern = path.join(baseDir, '**', 'index.@(ts|js)');
  const files = glob.sync(pattern, { nodir: true });
  for (const file of files) {
    if (path.resolve(file) === path.resolve(__filename)) continue;
    const rel = path.relative(baseDir, file).replace(/\\/g, '/');
    const route = '/' + rel.replace(/\/index\.(js|ts)$/i, '').replace(/index\.(js|ts)$/i, '');
    const mountPath = route.replace(/\[([^/]+?)\]/g, ':$1');
    try {
      const mod = require(file);
      const routerFactory = mod && (mod.default || mod);
      if (typeof routerFactory === 'function') {
        if (mountPath.startsWith('/users')) {
          app.use(mountPath, apiKeyAuth, routerFactory(client));
        } else {
          app.use(mountPath, routerFactory(client));
        }
      }
    } catch (err) {
      console.error(`Failed to mount router from ${file}:`, err);
    }
  }
}

export default mountRouters;
