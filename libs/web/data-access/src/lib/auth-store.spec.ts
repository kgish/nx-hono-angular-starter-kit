import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { AuthUser } from '@fullstack/schemas';
import { ApiPaths } from '@fullstack/util';
import { AuthStore } from './auth-store';

const user: AuthUser = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.org',
  emailVerified: true,
  image: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const session = {
  session: { expiresAt: '2026-02-01T00:00:00.000Z' },
  user,
};
const credentials = { email: user.email, password: 'demo' };

describe('AuthStore', () => {
  let store: AuthStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the session once', async () => {
    const first = store.loadSession();
    const second = store.loadSession();
    http.expectOne(ApiPaths.session).flush(session);
    await Promise.all([first, second]);
    expect(store.user()).toEqual(user);

    await store.loadSession();
    http.expectNone(ApiPaths.session);
  });

  it('is anonymous without a session', async () => {
    const done = store.loadSession();
    http.expectOne(ApiPaths.session).flush(null);
    await done;
    expect(store.isAuthenticated()).toBe(false);
  });

  it('asks again after the session request failed', async () => {
    const failed = store.loadSession();
    http
      .expectOne(ApiPaths.session)
      .error(new ProgressEvent('error'), { status: 0 });
    await failed;

    const retry = store.loadSession();
    http.expectOne(ApiPaths.session).flush(session);
    await retry;
    expect(store.isAuthenticated()).toBe(true);
  });

  it('signs in and out', async () => {
    const signIn = store.signIn(credentials);
    const request = http.expectOne(ApiPaths.signIn);
    expect(request.request.body).toEqual(credentials);
    request.flush({ redirect: false, token: 't', user });
    expect(await signIn).toEqual({ ok: true, value: user });
    expect(store.user()).toEqual(user);

    const signOut = store.signOut();
    http.expectOne(ApiPaths.signOut).flush({ success: true });
    await signOut;
    expect(store.isAuthenticated()).toBe(false);
  });

  it('reports wrong credentials as a code', async () => {
    const signIn = store.signIn(credentials);
    http.expectOne(ApiPaths.signIn).flush(
      {
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: 'Invalid email or password',
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    expect(await signIn).toEqual({ ok: false, error: 'invalidCredentials' });
    expect(store.isAuthenticated()).toBe(false);
  });

  it('reports a taken email on sign-up', async () => {
    const signUp = store.signUp({ name: 'Ada', ...credentials });
    http
      .expectOne(ApiPaths.signUp)
      .flush(
        { code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    expect(await signUp).toEqual({ ok: false, error: 'emailTaken' });
  });

  it('rejects responses that do not match the shared schema', async () => {
    const signIn = store.signIn(credentials);
    http.expectOne(ApiPaths.signIn).flush({ user: { id: 1 } });
    expect(await signIn).toEqual({ ok: false, error: 'unknown' });
  });

  it('asks for a reset link that leads to the reset page', async () => {
    const done = store.requestPasswordReset({ email: user.email });
    const request = http.expectOne(ApiPaths.requestPasswordReset);
    expect(request.request.body).toEqual({
      email: user.email,
      redirectTo: '/reset-password',
    });
    request.flush({ status: true, message: 'Check your email' });
    expect(await done).toEqual({ ok: true, value: undefined });
  });

  it('resets the password and reports a spent link', async () => {
    const input = { newPassword: 'battery staple', token: 't' };
    const done = store.resetPassword(input);
    const request = http.expectOne(ApiPaths.resetPassword);
    expect(request.request.body).toEqual(input);
    request.flush({ status: true });
    expect(await done).toEqual({ ok: true, value: undefined });

    const again = store.resetPassword(input);
    http
      .expectOne(ApiPaths.resetPassword)
      .flush(
        { code: 'INVALID_TOKEN', message: 'Invalid token' },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(await again).toEqual({ ok: false, error: 'invalidToken' });
  });
});
