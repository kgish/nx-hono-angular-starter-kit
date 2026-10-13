import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('@fullstack/web/feature-todos').then((m) => m.todosRoutes),
  },
  { path: '**', redirectTo: '' },
];
