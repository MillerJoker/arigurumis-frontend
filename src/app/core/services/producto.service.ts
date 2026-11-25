import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../models/api.model';
import { FiltroProductos, Producto, ProductoForm } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/productos`;
  private readonly urlAdmin = `${environment.apiUrl}/admin/productos`;

  // ---------- Sitio público (solo activos) ----------

  listar(filtro: FiltroProductos = {}): Observable<Pagina<Producto>> {
    return this.http.get<Pagina<Producto>>(this.url, { params: this.params(filtro) });
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.url}/${id}`);
  }

  // ---------- Panel (ADMIN y VENDEDOR) ----------

  /** Incluye inactivos. Sin "activo" en el filtro devuelve todos. */
  listarAdmin(filtro: FiltroProductos = {}): Observable<Pagina<Producto>> {
    return this.http.get<Pagina<Producto>>(this.urlAdmin, { params: this.params(filtro) });
  }

  obtenerAdmin(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.urlAdmin}/${id}`);
  }

  crear(form: ProductoForm): Observable<Producto> {
    return this.http.post<Producto>(this.url, form);
  }

  actualizar(id: number, form: ProductoForm): Observable<Producto> {
    return this.http.put<Producto>(`${this.url}/${id}`, form);
  }

  cambiarActivo(id: number, activo: boolean): Observable<Producto> {
    return this.http.put<Producto>(`${this.urlAdmin}/${id}/activo`, { activo });
  }

  /** Solo ADMIN. Con definitivo = true borra el registro y su foto (si nunca se vendió). */
  eliminar(id: number, definitivo: boolean): Observable<void> {
    const params = new HttpParams().set('definitivo', definitivo);
    return this.http.delete<void>(`${this.url}/${id}`, { params });
  }

  private params(filtro: FiltroProductos): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtro)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return params;
  }
}