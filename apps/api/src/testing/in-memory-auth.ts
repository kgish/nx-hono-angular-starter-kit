import { memoryAdapter } from 'better-auth/adapters/memory';
import { type AuthConfig, createAuth } from '../auth';
import type { Mailer } from '../mailer';
import { InMemoryMailer } from './in-memory-mailer';

/** better-auth on an in-memory store, so tests need no database or SMTP server. */
export const createInMemoryAuth = (
  mailer: Mailer = new InMemoryMailer(),
  options: Partial<AuthConfig> = {},
) =>
  createAuth({
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    secret: 'test-only-better-auth-secret-of-32-chars',
    mailer,
    // The origin app.request() uses.
    baseURL: 'http://localhost',
    ...options,
  });
