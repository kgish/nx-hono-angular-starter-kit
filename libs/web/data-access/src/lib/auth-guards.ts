import { inject } from '@angular/core';
import { type CanMatchFn, Router } from '@angular/router';
import { AuthStore } from './auth-store';

/** Where `authGuard` sends visitors without a session. */
export const LOGIN_PATH = '/login';

/** Matches only with a session; everyone else is sent to the login page. */
export const authGuard: CanMatchFn = async () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  await store.loadSession();
  return store.isAuthenticated() || router.parseUrl(LOGIN_PATH);
};

/**
 * Matches only without a session. It answers `false` rather than redirecting,
 * so the router moves on to the next route, which can then match as usual.
 */
export const guestGuard: CanMatchFn = async () => {
  const store = inject(AuthStore);
  await store.loadSession();
  return !store.isAuthenticated();
};
