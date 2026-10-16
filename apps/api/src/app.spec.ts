import {
  AuthErrorSchema,
  AuthResultSchema,
  AuthSessionSchema,
  AuthStatusSchema,
  TodoListSchema,
  TodoSchema,
  type ApiError,
} from '@fullstack/schemas';
import { ApiPaths } from '@fullstack/util';
import { beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from './app';
import type { Auth } from './auth';
import { DEMO_USER, seedDemoUser } from './demo-user';
import { createInMemoryAuth } from './testing/in-memory-auth';
import { InMemoryMailer } from './testing/in-memory-mailer';
import { InMemoryTodoRepository } from './testing/in-memory-todo.repository';

const json = (
  body: unknown,
  method = 'POST',
  headers: Record<string, string> = {},
): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

/** The `Cookie` header a browser would send back after this response. */
const cookieFrom = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');

const ada = {
  name: 'Ada',
  email: 'ada@example.org',
  password: 'correct horse',
};

describe('API', () => {
  let app: ReturnType<typeof createApp>;
  let auth: Auth;
  let mailer: InMemoryMailer;
  let dbUp: boolean;

  beforeEach(() => {
    dbUp = true;
    mailer = new InMemoryMailer();
    auth = createInMemoryAuth(mailer);
    app = createApp({
      todos: new InMemoryTodoRepository(),
      auth,
      pingDatabase: async () => dbUp,
      log: false,
    });
  });

  /** Registers a user (Ada by default) and returns the session cookie. */
  const signUp = async (user = ada) => {
    const res = await app.request(ApiPaths.signUp, json(user));
    expect(res.status).toBe(200);
    return { Cookie: cookieFrom(res) };
  };

  it('reports health', async () => {
    expect((await app.request(ApiPaths.health)).status).toBe(200);
    dbUp = false;
    const res = await app.request(ApiPaths.health);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      status: 'degraded',
      database: 'down',
    });
  });

  describe('todos', () => {
    it('require a session', async () => {
      const res = await app.request(ApiPaths.todos);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
      expect((await app.request(ApiPaths.todo(1))).status).toBe(401);
    });

    it('are created, listed, updated and deleted', async () => {
      const session = await signUp();
      const created = await app.request(
        ApiPaths.todos,
        json({ title: ' Write tests ' }, 'POST', session),
      );
      expect(created.status).toBe(201);
      const todo = TodoSchema.parse(await created.json());
      expect(todo.title).toBe('Write tests');

      const list = TodoListSchema.parse(
        await (await app.request(ApiPaths.todos, { headers: session })).json(),
      );
      expect(list).toHaveLength(1);

      const updated = await app.request(
        ApiPaths.todo(todo.id),
        json({ completed: true }, 'PATCH', session),
      );
      expect(TodoSchema.parse(await updated.json()).completed).toBe(true);

      expect(
        (
          await app.request(ApiPaths.todo(todo.id), {
            method: 'DELETE',
            headers: session,
          })
        ).status,
      ).toBe(204);
      expect(
        (await app.request(ApiPaths.todo(todo.id), { headers: session }))
          .status,
      ).toBe(404);
    });

    it('belong to the user who created them', async () => {
      const adaSession = await signUp();
      const bobSession = await signUp({
        name: 'Bob',
        email: 'bob@example.org',
        password: 'another password',
      });
      const created = await app.request(
        ApiPaths.todos,
        json({ title: "Ada's todo" }, 'POST', adaSession),
      );
      const { id } = TodoSchema.parse(await created.json());

      const bobsList = await app.request(ApiPaths.todos, {
        headers: bobSession,
      });
      expect(await bobsList.json()).toEqual([]);

      // Someone else's todo answers as if it did not exist.
      const asBob = (init: RequestInit = {}) =>
        app.request(ApiPaths.todo(id), {
          ...init,
          headers: { ...init.headers, ...bobSession },
        });
      expect((await asBob()).status).toBe(404);
      expect((await asBob(json({ completed: true }, 'PATCH'))).status).toBe(
        404,
      );
      expect((await asBob({ method: 'DELETE' })).status).toBe(404);

      const adasTodo = await app.request(ApiPaths.todo(id), {
        headers: adaSession,
      });
      expect(TodoSchema.parse(await adasTodo.json())).toMatchObject({
        title: "Ada's todo",
        completed: false,
      });
    });

    it('reject invalid input with the shared error shape', async () => {
      const session = await signUp();
      const res = await app.request(
        ApiPaths.todos,
        json({ title: '' }, 'POST', session),
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.error).toBe('Validation failed');
      expect(body.issues?.[0]?.path).toEqual(['title']);
    });

    it('reject non-numeric ids', async () => {
      const session = await signUp();
      expect(
        (await app.request(ApiPaths.todo('abc'), { headers: session })).status,
      ).toBe(400);
    });
  });

  describe('auth', () => {
    it('signs up, keeps the session and signs out', async () => {
      const session = await signUp();

      const current = AuthSessionSchema.parse(
        await (
          await app.request(ApiPaths.session, { headers: session })
        ).json(),
      );
      expect(current?.user).toMatchObject({ name: 'Ada', email: ada.email });

      const out = await app.request(
        ApiPaths.signOut,
        json({}, 'POST', session),
      );
      expect(out.status).toBe(200);
      const cleared = { Cookie: cookieFrom(out) };
      expect(
        await (
          await app.request(ApiPaths.session, { headers: cleared })
        ).json(),
      ).toBeNull();
      expect(
        (await app.request(ApiPaths.todos, { headers: session })).status,
      ).toBe(401);
    });

    it('signs in with the password chosen at sign-up', async () => {
      await signUp();
      const res = await app.request(
        ApiPaths.signIn,
        json({ email: ada.email, password: ada.password }),
      );
      expect(res.status).toBe(200);
      expect(AuthResultSchema.parse(await res.json()).user.email).toBe(
        ada.email,
      );
      expect(
        (
          await app.request(ApiPaths.todos, {
            headers: { Cookie: cookieFrom(res) },
          })
        ).status,
      ).toBe(200);
    });

    it('rejects a wrong password', async () => {
      await signUp();
      const res = await app.request(
        ApiPaths.signIn,
        json({ email: ada.email, password: 'wrong password' }),
      );
      expect(res.status).toBe(401);
      expect(AuthErrorSchema.parse(await res.json()).code).toBe(
        'INVALID_EMAIL_OR_PASSWORD',
      );
    });

    it('rejects a second account for the same email', async () => {
      await signUp();
      const res = await app.request(ApiPaths.signUp, json(ada));
      expect(res.status).toBe(422);
      expect(AuthErrorSchema.parse(await res.json()).code).toBe(
        'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
      );
    });

    it('enforces the shared sign-up rules', async () => {
      const short = await app.request(
        ApiPaths.signUp,
        json({ ...ada, password: 'short' }),
      );
      expect(short.status).toBe(400);
      expect(AuthErrorSchema.parse(await short.json())).toEqual({
        code: 'VALIDATION_FAILED',
        message: 'Password must be at least 8 characters',
      });

      const nameless = await app.request(
        ApiPaths.signUp,
        json({ ...ada, name: ' ' }),
      );
      expect(nameless.status).toBe(400);
      expect(AuthErrorSchema.parse(await nameless.json())).toEqual({
        code: 'VALIDATION_FAILED',
        message: 'Name is required',
      });
    });
  });

  describe('password reset', () => {
    const requestReset = (email: string, language = 'en') =>
      app.request(
        ApiPaths.requestPasswordReset,
        json({ email, redirectTo: '/reset-password' }, 'POST', {
          'Accept-Language': language,
        }),
      );

    /** Follows the emailed link to the web page, as a browser would. */
    const tokenFromEmail = async () => {
      const link = mailer.sent.at(-1)?.text.match(/https?:\/\/\S+/)?.[0];
      expect(link).toBeDefined();
      const res = await app.request(link ?? '');
      expect(res.status).toBe(302);
      const target = new URL(res.headers.get('Location') ?? '');
      expect(target.pathname).toBe('/reset-password');
      return target.searchParams.get('token') ?? '';
    };

    const signIn = (password: string) =>
      app.request(ApiPaths.signIn, json({ email: ada.email, password }));

    it('emails a link and sets the new password', async () => {
      const session = await signUp();
      const res = await requestReset(ada.email);
      expect(res.status).toBe(200);
      AuthStatusSchema.parse(await res.json());
      expect(mailer.sent).toHaveLength(1);
      expect(mailer.sent[0]).toMatchObject({
        to: ada.email,
        subject: 'Reset your Todos password',
      });

      const reset = await app.request(
        ApiPaths.resetPassword,
        json({ newPassword: 'battery staple', token: await tokenFromEmail() }),
      );
      expect(reset.status).toBe(200);

      expect((await signIn('battery staple')).status).toBe(200);
      expect((await signIn(ada.password)).status).toBe(401);
      // The reset signed out the session from before.
      expect(
        (await app.request(ApiPaths.todos, { headers: session })).status,
      ).toBe(401);
    });

    it('writes the email in the language of the request', async () => {
      await signUp();
      await requestReset(ada.email, 'nl-NL,nl;q=0.9,en;q=0.8');
      expect(mailer.sent[0]?.subject).toBe(
        'Stel je wachtwoord voor Taken opnieuw in',
      );
    });

    it('answers the same for an unknown address, without an email', async () => {
      const res = await requestReset('nobody@example.org');
      expect(res.status).toBe(200);
      AuthStatusSchema.parse(await res.json());
      expect(mailer.sent).toHaveLength(0);
    });

    it('accepts each link once', async () => {
      await signUp();
      await requestReset(ada.email);
      const token = await tokenFromEmail();
      const body = json({ newPassword: 'battery staple', token });
      expect((await app.request(ApiPaths.resetPassword, body)).status).toBe(
        200,
      );

      const again = await app.request(
        ApiPaths.resetPassword,
        json({ newPassword: 'another one', token }),
      );
      expect(again.status).toBe(400);
      expect(AuthErrorSchema.parse(await again.json()).code).toBe(
        'INVALID_TOKEN',
      );
    });

    it('sends an unknown link to the web page with an error', async () => {
      const res = await app.request(
        `${ApiPaths.resetPassword}/nope?callbackURL=%2Freset-password`,
      );
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe(
        'http://localhost/reset-password?error=INVALID_TOKEN',
      );
    });

    it('enforces the shared password rules', async () => {
      await signUp();
      await requestReset(ada.email);
      const res = await app.request(
        ApiPaths.resetPassword,
        json({ newPassword: 'short', token: await tokenFromEmail() }),
      );
      expect(res.status).toBe(400);
      expect(AuthErrorSchema.parse(await res.json()).code).toBe(
        'VALIDATION_FAILED',
      );
    });
  });

  describe('demo user', () => {
    it('signs in with demo@example.org / demo', async () => {
      expect(await seedDemoUser(auth)).toBe(true);
      const res = await app.request(
        ApiPaths.signIn,
        json({ email: DEMO_USER.email, password: DEMO_USER.password }),
      );
      expect(res.status).toBe(200);
      expect(AuthResultSchema.parse(await res.json()).user).toMatchObject({
        email: 'demo@example.org',
        name: 'Demo User',
        emailVerified: true,
      });
    });

    it('is only created once', async () => {
      expect(await seedDemoUser(auth)).toBe(true);
      expect(await seedDemoUser(auth)).toBe(false);
    });
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await app.request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});
