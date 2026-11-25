import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../models/api.model';
import { FiltroUsuarios, UsuarioAdmin, UsuarioCrear, UsuarioEditar } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/admin/usuarios`;

  listar(filtro: FiltroUsuarios = {}): Observable<Pagina<UsuarioAdmin>> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtro)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http.get<Pagina<UsuarioAdmin>>(this.url, { params });
  }

  obtener(id: number): Observable<UsuarioAdmin> {
    return this.http.get<UsuarioAdmin>(`${this.url}/${id}`);
  }

  crear(datos: UsuarioCrear): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(this.url, datos);
  }

  actualizar(id: number, datos: UsuarioEditar): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.url}/${id}`, datos);
  }

  cambiarActivo(id: number, activo: boolean): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.url}/${id}/activo`, { activo });
  }

  restablecerPassword(id: number, passwordNueva: string): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/password`, { passwordNueva });
  }

  /** Con definitivo = false solo desactiva. Con true borra, si no tiene pedidos. */
  eliminar(id: number, definitivo: boolean): Observable<void> {
    const params = new HttpParams().set('definitivo', definitivo);
    return this.http.delete<void>(`${this.url}/${id}`, { params });
  }
}