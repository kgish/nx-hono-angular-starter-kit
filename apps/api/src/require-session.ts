import type { ApiError } from '@fullstack/schemas';
import { createMiddleware } from 'hono/factory';
import type { Auth } from './auth';

export interface SessionEnv {
  Variables: {
    user: NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>['user'];
  };
}

/** Answers 401 without a valid session cookie; otherwise sets `c.var.user`. */
export const requireSession = (auth: Auth) =>
  createMiddleware<SessionEnv>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json<ApiError>({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
    return undefined;
  });
