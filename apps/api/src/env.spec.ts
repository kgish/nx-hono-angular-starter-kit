import { describe, expect, it, spyOn } from 'bun:test';
import { loadEnv } from './env';

const secret = 'x'.repeat(32);

describe('loadEnv', () => {
  it('runs without auth settings outside production, with the demo user', () => {
    const env = loadEnv({});
    expect(env.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.SEED_DEMO_USER).toBe(true);
  });

  it('accepts a cookie prefix that is a valid cookie name', () => {
    expect(
      loadEnv({ BETTER_AUTH_COOKIE_PREFIX: 'todos-docker' })
        .BETTER_AUTH_COOKIE_PREFIX,
    ).toBe('todos-docker');
    const log = spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      loadEnv({ BETTER_AUTH_COOKIE_PREFIX: 'todos docker' }),
    ).toThrow();
    log.mockRestore();
  });

  it('sends email through local Mailpit outside production', () => {
    expect(loadEnv({}).SMTP_URL).toBe('smtp://localhost:1025');
  });

  it('requires a secret and an SMTP server in production', () => {
    const log = spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => loadEnv({ NODE_ENV: 'production' })).toThrow();
    expect(() =>
      loadEnv({ NODE_ENV: 'production', BETTER_AUTH_SECRET: secret }),
    ).toThrow();
    expect(log.mock.calls[1]?.[1]).toEqual({
      SMTP_URL: ['Required in production'],
      MAIL_FROM: ['Required in production'],
    });
    log.mockRestore();
  });

  it('leaves the demo user out of production unless asked for', () => {
    const production = {
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: secret,
      SMTP_URL: 'smtps://user:password@smtp.example.com:465',
      MAIL_FROM: 'Todos <no-reply@example.com>',
    };
    expect(loadEnv(production).SEED_DEMO_USER).toBe(false);
    expect(
      loadEnv({ ...production, SEED_DEMO_USER: 'true' }).SEED_DEMO_USER,
    ).toBe(true);
  });
});
