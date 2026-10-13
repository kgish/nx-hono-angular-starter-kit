import { createDb, runMigrations } from '@fullstack/api/db';
import { loadEnv } from './env';

const env = loadEnv();
const db = createDb(env.DATABASE_URL);

await runMigrations(db, env.MIGRATIONS_DIR);
await db.$client.close();
console.log(`Migrations from ${env.MIGRATIONS_DIR} applied`);
