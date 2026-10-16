import type { TodoRepository } from '@fullstack/api/db';
import type { ApiError } from '@fullstack/schemas';
import { API_PREFIX } from '@fullstack/util';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { Auth } from './auth';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { todoRoutes } from './routes/todos';

export interface AppDeps {
  todos: TodoRepository;
  auth: Auth;
  pingDatabase: () => Promise<boolean>;
  corsOrigin?: string;
  log?: boolean;
}

export function createApp({
  todos,
  auth,
  pingDatabase,
  corsOrigin,
  log = true,
}: AppDeps) {
  const app = new Hono();

  // Registered before basePath(), which copies these handlers.
  app.notFound((c) => c.json<ApiError>({ error: 'Not found' }, 404));
  app.onError((error, c) => {
    console.error(error);
    return c.json<ApiError>({ error: 'Internal server error' }, 500);
  });

  if (log) app.use(logger());
  app.use(secureHeaders());
  // Credentials let a browser on another origin send the session cookie.
  if (corsOrigin)
    app.use(
      `${API_PREFIX}/*`,
      cors({ origin: corsOrigin.split(','), credentials: true }),
    );

  const routes = app
    .basePath(API_PREFIX)
    .route('/health', healthRoutes(pingDatabase))
    .route('/auth', authRoutes(auth))
    .route('/todos', todoRoutes(todos, auth));

  return routes;
}

export type AppType = ReturnType<typeof createApp>;
