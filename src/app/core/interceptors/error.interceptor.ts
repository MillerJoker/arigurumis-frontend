import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { toApiError } from '../utils/api-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Sesión vencida o token inválido: cerramos sesión (excepto en el propio login)
      if (err.status === 401 && !req.url.endsWith('/auth/login') && auth.autenticado()) {
        auth.logout();
      }
      return throwError(() => toApiError(err));
    }),
  );
};