import type { Routes } from '@angular/router';

export const authRoutes: Routes = [
  // The app mounts these at '' for visitors without a session. Without this
  // entry '/' would match here with no page and render an empty outlet.
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
  {
    // RESET_PASSWORD_PATH: the link in the reset email ends here.
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password-page').then((m) => m.ResetPasswordPage),
  },
];
