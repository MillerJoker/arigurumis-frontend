import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pagina } from '../models/api.model';
import { EstadoPedido, Pedido, PedidoCreate } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pedidos`;

  /** Público: con token se asocia al usuario, sin token es de invitado. */
  crear(pedido: PedidoCreate): Observable<Pedido> {
    return this.http.post<Pedido>(this.url, pedido);
  }

  // ---------- Panel (ADMIN y VENDEDOR) ----------

  listar(estado: EstadoPedido | null, pagina = 0, tamanio = 20): Observable<Pagina<Pedido>> {
    let params = new HttpParams().set('pagina', pagina).set('tamanio', tamanio);
    if (estado) params = params.set('estado', estado);
    return this.http.get<Pagina<Pedido>>(this.url, { params });
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.url}/${id}`);
  }

  cambiarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.url}/${id}/estado`, { estado });
  }
}