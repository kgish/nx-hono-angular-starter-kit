import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './libs/api/db/src/lib/schema.ts',
  out: './libs/api/db/migrations',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://app:app@localhost:5432/app',
  },
});
