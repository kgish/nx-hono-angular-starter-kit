import { Hono } from 'hono';
import type { Auth } from '../auth';

/** Hands every request under the auth prefix to better-auth. */
export const authRoutes = (auth: Auth) =>
  new Hono().on(['GET', 'POST'], '/*', (c) => auth.handler(c.req.raw));
