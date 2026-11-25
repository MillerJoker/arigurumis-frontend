import { Routes } from '@angular/router';
import { carritoListoGuard } from '../../core/guards/carrito.guard';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    title: 'Catálogo · Arigurumis',
    loadComponent: () => import('./pages/product-list.component').then(m => m.ProductListComponent),
  },
  {
    path: 'carrito',
    title: 'Mi carrito · Arigurumis',
    loadComponent: () => import('./pages/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'checkout',
    title: 'Finalizar pedido · Arigurumis',
    canActivate: [carritoListoGuard],
    loadComponent: () => import('./pages/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'pedido-confirmado/:id',
    title: 'Pedido registrado · Arigurumis',
    loadComponent: () =>
      import('./pages/order-confirmation.component').then(m => m.OrderConfirmationComponent),
  },
  {
    path: ':id',
    title: 'Producto · Arigurumis',
    loadComponent: () => import('./pages/product-detail.component').then(m => m.ProductDetailComponent),
  },
];