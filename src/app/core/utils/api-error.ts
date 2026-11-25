import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api.model';

/** Convierte cualquier error HTTP al formato ApiError del backend. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return { status: 0, mensaje: 'No se pudo conectar con el servidor. Intenta de nuevo en unos minutos.' };
    }
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.mensaje === 'string') {
      return {
        status: err.status,
        mensaje: body.mensaje,
        errores: Array.isArray(body.errores) ? body.errores : undefined,
      };
    }
    return { status: err.status, mensaje: 'Ocurrió un error inesperado.' };
  }
  return { status: -1, mensaje: 'Ocurrió un error inesperado.' };
}