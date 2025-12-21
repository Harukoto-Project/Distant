import path from 'path';
import fs from 'fs';
import type { Client } from 'discord.js';
import type express from 'express';
import { apiKeyAuth } from './middleware/auth';

function findIndexFiles(
  dir: string,
  baseDir: string,
  files: string[] = [],
): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findIndexFiles(fullPath, baseDir, files);
    } else if (entry.isFile() && /^index\.(ts|js)$/i.test(entry.name)) {
      if (
        path.resolve(fullPath) !== path.resolve(baseDir, 'index.js') &&
        path.resolve(fullPath) !== path.resolve(baseDir, 'index.ts')
      ) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

export function mountRouters(
  app: express.Application,
  client: Client,
  baseDir = __dirname,
) {
  const files = findIndexFiles(baseDir, baseDir);
  for (const file of files) {
    if (path.resolve(file) === path.resolve(__filename)) continue;
    if (file.endsWith('loader.js') || file.endsWith('loader.ts')) continue;
    const rel = path.relative(baseDir, file).replace(/\\/g, '/');
    const route =
      '/' +
      rel.replace(/\/index\.(js|ts)$/i, '').replace(/index\.(js|ts)$/i, '');
    const mountPath = route.replace(/\[([^/]+?)\]/g, ':$1');
    if (mountPath === '/' || mountPath === '') continue;
    try {
      const mod = require(file);
      const routerFactory = mod && (mod.default || mod);
      if (typeof routerFactory === 'function') {
        if (mountPath.startsWith('/users')) {
          app.use(mountPath, apiKeyAuth, routerFactory(client));
        } else {
          app.use(mountPath, routerFactory(client));
        }
        console.log(`Mounted router: ${mountPath}`);
      }
    } catch (err) {
      console.error(`Failed to mount router from ${file}:`, err);
    }
  }
}

export default mountRouters;