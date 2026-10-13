import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url().default('postgres://app:app@localhost:5432/app'),
  MIGRATIONS_DIR: z.string().default('libs/api/db/migrations'),
  RUN_MIGRATIONS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  CORS_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(
  source: Record<string, string | undefined> = Bun.env,
): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    console.error(
      'Invalid environment variables',
      z.flattenError(result.error).fieldErrors,
    );
    throw new Error('Invalid environment variables');
  }
  return result.data;
}
