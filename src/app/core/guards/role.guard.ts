import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] as Rol[] | undefined) ?? [];
  const auth = inject(AuthService);
  if (roles.length === 0 || auth.tieneRol(roles)) return true;

  // Personal del panel sin permiso para esta sección: de vuelta al resumen
  return inject(Router).createUrlTree([auth.esStaff() ? '/admin/dashboard' : '/']);
};