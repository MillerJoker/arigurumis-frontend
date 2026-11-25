import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../models/catalogo.model';

export interface CategoriaForm {
  nombre: string;
  descripcion: string | null;
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url);
  }

  // ADMIN y VENDEDOR
  crear(form: CategoriaForm): Observable<Categoria> {
    return this.http.post<Categoria>(this.url, form);
  }

  actualizar(id: number, form: CategoriaForm): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.url}/${id}`, form);
  }

  /** Solo ADMIN. Falla con 409 si la categoría aún tiene productos. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}