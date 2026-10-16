import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  withComponentInputBinding,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ApiPaths } from '@fullstack/util';
import { provideTranslateService } from '@ngx-translate/core';
import { appRoutes } from './app.routes';

const user = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.org',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const signedIn = { session: { expiresAt: user.updatedAt }, user };

describe('app routes', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(appRoutes, withComponentInputBinding()),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Opens `url` the way the app starts: the guards first ask who is signed in. */
  const open = async (url: string, session: object | null) => {
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl(url);
    await vi.waitFor(() => http.expectOne(ApiPaths.session).flush(session));
    if (session) {
      await vi.waitFor(() => http.expectOne(ApiPaths.todos).flush([]));
    }
    await navigation;
    return {
      url: TestBed.inject(Router).url,
      page: harness.routeNativeElement?.tagName.toLowerCase(),
    };
  };

  it('shows the login page to visitors without a session', async () => {
    expect(await open('/', null)).toEqual({
      url: '/login',
      page: 'lib-login-page',
    });
  });

  it('shows the todos once signed in', async () => {
    expect(await open('/', signedIn)).toEqual({
      url: '/',
      page: 'lib-todos-page',
    });
  });

  it('sends signed-in users from the login page to the todos', async () => {
    expect(await open('/login', signedIn)).toEqual({
      url: '/',
      page: 'lib-todos-page',
    });
  });

  it('opens the reset page from the emailed link', async () => {
    expect(await open('/reset-password?token=t', null)).toEqual({
      url: '/reset-password?token=t',
      page: 'lib-reset-password-page',
    });
  });

  it('sends unknown URLs without a session to the login page', async () => {
    expect((await open('/nope', null)).url).toBe('/login');
  });
});
