import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
import * as schema from './schema';

export function createDb(url: string) {
  return drizzle({ connection: { url }, schema });
}

export type Db = ReturnType<typeof createDb>;

export async function runMigrations(db: Db, migrationsFolder: string) {
  await migrate(db, { migrationsFolder });
}
