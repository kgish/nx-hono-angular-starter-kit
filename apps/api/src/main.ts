import {
  createDb,
  DrizzleTodoRepository,
  runMigrations,
} from '@fullstack/api/db';
import { sql } from 'drizzle-orm';
import { createApp } from './app';
import { loadEnv } from './env';

const env = loadEnv();
const db = createDb(env.DATABASE_URL);

if (env.RUN_MIGRATIONS) {
  await runMigrations(db, env.MIGRATIONS_DIR);
  console.log('Database migrations applied');
}

const app = createApp({
  todos: new DrizzleTodoRepository(db),
  pingDatabase: async () => {
    await db.execute(sql`select 1`);
    return true;
  },
  corsOrigin: env.CORS_ORIGIN,
});

const server = Bun.serve({ port: env.PORT, fetch: app.fetch });
console.log(`API listening on http://localhost:${server.port}`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await server.stop();
    await db.$client.close();
    process.exit(0);
  });
}
