import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Estadisticas } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly http = inject(HttpClient);

  obtener(umbralStock = 5): Observable<Estadisticas> {
    const params = new HttpParams().set('umbralStock', umbralStock);
    return this.http.get<Estadisticas>(`${environment.apiUrl}/admin/estadisticas`, { params });
  }
}