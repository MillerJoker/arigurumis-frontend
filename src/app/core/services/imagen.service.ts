import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ImagenSubida {
  nombre: string;
  url: string;          // "/api/imagenes/uuid.jpg": es la que se guarda en el producto
}

@Injectable({ providedIn: 'root' })
export class ImagenService {
  private readonly http = inject(HttpClient);

  subir(blob: Blob): Observable<ImagenSubida> {
    const form = new FormData();
    form.append('archivo', blob, 'foto.jpg');   // el campo debe llamarse "archivo"
    // No se fija Content-Type: el navegador añade el boundary del multipart
    return this.http.post<ImagenSubida>(`${environment.apiUrl}/imagenes`, form);
  }
}