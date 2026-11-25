import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('./features/landing/landing.routes').then(m => m.LANDING_ROUTES),
      },
      {
        path: 'catalogo',
        loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.CATALOG_ROUTES),
      },
    ],
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];