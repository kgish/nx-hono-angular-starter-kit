import { z } from 'zod';

// Outside production these defaults let `npm run dev` work without setup.
const DEV_AUTH_SECRET = 'dev-only-better-auth-secret-never-use-in-production';
/** Mailpit from compose.yaml (`npm run db:up`); its inbox is on :8025. */
const DEV_SMTP_URL = 'smtp://localhost:1025';
const DEV_MAIL_FROM = 'Todos <no-reply@localhost>';

const REQUIRED_IN_PRODUCTION = [
  'BETTER_AUTH_SECRET',
  'SMTP_URL',
  'MAIL_FROM',
] as const;

const EnvSchema = z
  .object({
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
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    /** Public URL of the web app; inferred from each request when unset. */
    BETTER_AUTH_URL: z.url().optional(),
    SEED_DEMO_USER: z.enum(['true', 'false']).optional(),
    /** Where emails go out, e.g. `smtps://user:password@smtp.example.com:465`. */
    SMTP_URL: z.url().optional(),
    /** Sender of the emails, e.g. `Todos <no-reply@example.com>`. */
    MAIL_FROM: z.string().min(1).optional(),
  })
  .transform((env, ctx) => {
    const production = env.NODE_ENV === 'production';
    const missing = production
      ? REQUIRED_IN_PRODUCTION.filter((key) => !env[key])
      : [];
    for (const key of missing) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: 'Required in production',
      });
    }
    if (missing.length > 0) return z.NEVER;
    return {
      ...env,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ?? DEV_AUTH_SECRET,
      SMTP_URL: env.SMTP_URL ?? DEV_SMTP_URL,
      MAIL_FROM: env.MAIL_FROM ?? DEV_MAIL_FROM,
      // The demo account has a published password, so production opts in.
      SEED_DEMO_USER: env.SEED_DEMO_USER
        ? env.SEED_DEMO_USER === 'true'
        : !production,
    };
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
