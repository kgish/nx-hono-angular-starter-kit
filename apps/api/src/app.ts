import type { TodoRepository } from '@fullstack/api/db';
import type { ApiError } from '@fullstack/schemas';
import { API_PREFIX } from '@fullstack/util';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { healthRoutes } from './routes/health';
import { todoRoutes } from './routes/todos';

export interface AppDeps {
  todos: TodoRepository;
  pingDatabase: () => Promise<boolean>;
  corsOrigin?: string;
  log?: boolean;
}

export function createApp({
  todos,
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
  if (corsOrigin)
    app.use(`${API_PREFIX}/*`, cors({ origin: corsOrigin.split(',') }));

  const routes = app
    .basePath(API_PREFIX)
    .route('/health', healthRoutes(pingDatabase))
    .route('/todos', todoRoutes(todos));

  return routes;
}

export type AppType = ReturnType<typeof createApp>;
