import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Ingresar · Arigurumis',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'VENDEDOR'] },
    loadComponent: () =>
      import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Resumen · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'pedidos',
        title: 'Pedidos · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/orders/order-list.component').then(m => m.OrderListComponent),
      },
      {
        path: 'pedidos/:id',
        title: 'Detalle del pedido · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/orders/order-detail.component').then(m => m.OrderDetailComponent),
      },
      {
        path: 'productos',
        title: 'Productos · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/products/product-manage.component').then(m => m.ProductManageComponent),
      },
      {
        path: 'productos/nuevo',
        title: 'Nuevo producto · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/products/product-form.component').then(m => m.ProductFormComponent),
      },
      {
        path: 'productos/:id/editar',
        title: 'Editar producto · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/products/product-form.component').then(m => m.ProductFormComponent),
      },
      {
        path: 'categorias',
        title: 'Categorías · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/categories/category-manage.component').then(m => m.CategoryManageComponent),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },                 // solo administradores
        children: [
          {
            path: '',
            title: 'Usuarios · Panel Arigurumis',
            loadComponent: () =>
              import('./pages/users/user-manage.component').then(m => m.UserManageComponent),
          },
          {
            path: 'nuevo',
            title: 'Nuevo usuario · Panel Arigurumis',
            loadComponent: () =>
              import('./pages/users/user-form.component').then(m => m.UserFormComponent),
          },
          {
            path: ':id/editar',
            title: 'Editar usuario · Panel Arigurumis',
            loadComponent: () =>
              import('./pages/users/user-form.component').then(m => m.UserFormComponent),
          },
        ],
      },
      {
        path: 'perfil',
        title: 'Mi perfil · Panel Arigurumis',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(m => m.ProfileComponent),
      },
    ],
  },
];