import type { Routes } from '@angular/router';

export const todosRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./todos-page').then((m) => m.TodosPage),
  },
];
