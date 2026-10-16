import {
  authSchema,
  createDb,
  DrizzleTodoRepository,
  runMigrations,
} from '@fullstack/api/db';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sql } from 'drizzle-orm';
import { createApp } from './app';
import { createAuth } from './auth';
import { DEMO_USER, seedDemoUser } from './demo-user';
import { loadEnv } from './env';
import { createSmtpMailer } from './mailer';

const env = loadEnv();
const db = createDb(env.DATABASE_URL);

if (env.RUN_MIGRATIONS) {
  await runMigrations(db, env.MIGRATIONS_DIR);
  console.log('Database migrations applied');
}

const auth = createAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
    usePlural: true,
  }),
  secret: env.BETTER_AUTH_SECRET,
  mailer: createSmtpMailer(env.SMTP_URL, env.MAIL_FROM),
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGIN?.split(','),
  cookiePrefix: env.BETTER_AUTH_COOKIE_PREFIX,
});

if (env.SEED_DEMO_USER && (await seedDemoUser(auth))) {
  console.log(`Demo user ${DEMO_USER.email} created`);
}

const app = createApp({
  todos: new DrizzleTodoRepository(db),
  auth,
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
