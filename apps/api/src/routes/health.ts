import type { Health } from '@fullstack/schemas';
import { Hono } from 'hono';

export const healthRoutes = (pingDatabase: () => Promise<boolean>) =>
  new Hono().get('/', async (c) => {
    const up = await pingDatabase().catch(() => false);
    const body: Health = {
      status: up ? 'ok' : 'degraded',
      database: up ? 'up' : 'down',
      uptime: process.uptime(),
    };
    return c.json(body, up ? 200 : 503);
  });
