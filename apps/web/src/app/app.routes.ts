import { Route } from '@angular/router';
import { authGuard, guestGuard } from '@fullstack/web/data-access';

export const appRoutes: Route[] = [
  // Login, register and forgot-password. With a session this route does not
  // match, so those URLs fall through to the todos and then to '/'.
  {
    path: '',
    canMatch: [guestGuard],
    loadChildren: () =>
      import('@fullstack/web/feature-auth').then((m) => m.authRoutes),
  },
  // Everything else needs a session; without one, authGuard sends to /login.
  {
    path: '',
    canMatch: [authGuard],
    loadChildren: () =>
      import('@fullstack/web/feature-todos').then((m) => m.todosRoutes),
  },
  { path: '**', redirectTo: '' },
];
