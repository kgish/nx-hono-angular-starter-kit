import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiPaths } from '@fullstack/util';
import { authGuard, guestGuard } from './auth-guards';

@Component({ template: '' })
class Blank {}

const user = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.org',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('auth guards', () => {
  let router: Router;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', canMatch: [guestGuard], component: Blank },
          { path: '', canMatch: [authGuard], component: Blank },
          { path: '**', redirectTo: '' },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Navigates while the guards ask the API for the given session. */
  const navigate = async (url: string, session: object | null) => {
    const navigation = router.navigateByUrl(url);
    await vi.waitFor(() => http.expectOne(ApiPaths.session).flush(session));
    await navigation;
    return router.url;
  };

  it('sends visitors without a session to the login page', async () => {
    expect(await navigate('/', null)).toBe('/login');
  });

  it('keeps signed-in users away from the login page', async () => {
    const session = { session: { expiresAt: user.updatedAt }, user };
    expect(await navigate('/login', session)).toBe('/');
  });
});
