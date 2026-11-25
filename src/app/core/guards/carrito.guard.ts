import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../services/cart.service';

export const carritoListoGuard: CanActivateFn = () => {
  const carrito = inject(CartService);
  return !carrito.vacio() && !carrito.detallesIncompletos()
    ? true
    : inject(Router).createUrlTree(['/catalogo/carrito']);
};