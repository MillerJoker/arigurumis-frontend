import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError } from '../../../../core/models/api.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div class="pointer-events-none absolute -top-20 -left-20 size-80 rounded-full bg-lila-200/60 blur-3xl"></div>
      <div class="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-rosa-200/60 blur-3xl"></div>

      <div class="card relative w-full max-w-md">
        <img src="images/logo.png" alt="Arigurumis" class="mx-auto mb-6 w-56">
        <h1 class="text-center text-2xl font-bold text-lila-700">Panel de administración</h1>

        <form class="mt-6 space-y-4" (submit)="entrar($event)">
          <div>
            <label for="correo" class="mb-1 block text-sm font-bold text-lila-800">Correo</label>
            <input id="correo" type="email" class="input" autocomplete="username" required
                   placeholder="Correo electrónico"
                   [value]="correo()" (input)="correo.set($any($event.target).value)">
          </div>
          <div>
            <label for="password" class="mb-1 block text-sm font-bold text-lila-800">Contraseña</label>
            <input id="password" type="password" class="input" autocomplete="current-password" required
                   placeholder="Tu contraseña"
                   [value]="password()" (input)="password.set($any($event.target).value)">
          </div>

          @if (error()) {
            <p class="rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-semibold text-rosa-600" role="alert">
              {{ error() }}
            </p>
          }

          <button type="submit" class="btn-primary w-full" [disabled]="cargando()">
            {{ cargando() ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </main>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly correo = signal('');
  readonly password = signal('');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  entrar(event: Event): void {
    event.preventDefault();
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.correo().trim(), this.password()).subscribe({
      next: () => {
        if (!this.auth.esStaff()) {
          this.auth.logout(false);
          this.error.set('Esta cuenta no tiene acceso al panel.');
          this.cargando.set(false);
          return;
        }
        // Solo rutas internas: evita redirecciones abiertas
        const destino = this.route.snapshot.queryParamMap.get('returnUrl');
        const seguro = destino && destino.startsWith('/') && !destino.startsWith('//');
        this.router.navigateByUrl(seguro ? destino : '/admin');
      },
      error: (e: ApiError) => {
        this.error.set(e.mensaje);
        this.cargando.set(false);
      },
    });
  }
}