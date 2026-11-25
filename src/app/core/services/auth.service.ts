import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Rol, Usuario } from '../models/auth.model';

interface Sesion {
  token: string;
  usuario: Usuario;
  expira: number;           // epoch en ms
}

const STORAGE_KEY = 'arigurumis.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sesion = signal<Sesion | null>(this.cargar());

  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');
  readonly esStaff = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMIN' || rol === 'VENDEDOR';
  });

  login(correo: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { correo, password })
      .pipe(tap(r => this.guardar(r)));
  }

  logout(redirigir = true): void {
    this.sesion.set(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* almacenamiento no disponible */ }
    if (redirigir) this.router.navigate(['/admin/login']);
  }

    cambiarPassword(passwordActual: string, passwordNueva: string): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/auth/password`, { passwordActual, passwordNueva });
  }

  /** Mantiene la sesión al día cuando la persona edita su propio nombre o correo. */
  actualizarDatos(nombre: string, correo: string): void {
    const s = this.sesion();
    if (!s) return;
    const nueva: Sesion = { ...s, usuario: { ...s.usuario, nombre, correo } };
    this.sesion.set(nueva);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva)); } catch { /* ignorar */ }
  }

  tieneRol(roles: Rol[]): boolean {
    const rol = this.usuario()?.rol;
    return !!rol && roles.includes(rol);
  }

  private guardar(r: LoginResponse): void {
    const sesion: Sesion = {
      token: r.token,
      usuario: { id: r.usuarioId, nombre: r.nombre, correo: r.correo, rol: r.rol },
      expira: Date.now() + r.expiraEnSegundos * 1000,
    };
    this.sesion.set(sesion);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion)); } catch { /* ignorar */ }
  }

  private cargar(): Sesion | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as Sesion;
      if (!s.token || s.expira <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return s;
    } catch {
      return null;
    }
  }
}