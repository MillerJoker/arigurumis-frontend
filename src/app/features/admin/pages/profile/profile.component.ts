import { Component, computed, inject, signal } from '@angular/core';
import { ApiError } from '../../../../core/models/api.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { validarPassword } from '../../../../core/utils/password';
import { infoRol } from '../../../../core/utils/rol';
import { PasswordFieldComponent } from '../../../../shared/components/password-field.component';

type Campo = 'actual' | 'nueva' | 'confirmar';

@Component({
  selector: 'app-profile',
  imports: [PasswordFieldComponent],
  template: `
    <header>
      <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Tu cuenta</p>
      <h1 class="text-3xl font-bold text-lila-800">Mi perfil</h1>
    </header>

    <div class="mt-6 grid items-start gap-6 lg:grid-cols-5">
      <section class="card lg:col-span-2">
        <h2 class="text-xl font-bold text-lila-700">Mis datos</h2>
        @if (auth.usuario(); as u) {
          <dl class="mt-4 space-y-3">
            <div>
              <dt class="text-sm font-bold text-lila-500">Nombre</dt>
              <dd class="font-bold text-lila-800">{{ u.nombre }}</dd>
            </div>
            <div>
              <dt class="text-sm font-bold text-lila-500">Correo</dt>
              <dd class="font-bold break-all text-lila-800">{{ u.correo }}</dd>
            </div>
            <div>
              <dt class="text-sm font-bold text-lila-500">Rol</dt>
              <dd>
                <span class="rounded-full px-3 py-1 text-xs font-extrabold" [class]="rol().badge">{{ rol().texto }}</span>
              </dd>
            </div>
          </dl>
        }
        <p class="mt-4 text-sm text-lila-800/70">
          Si necesitas cambiar tu nombre o tu correo, pídeselo a un administrador.
        </p>
        <button type="button" class="btn-outline mt-5 w-full" (click)="auth.logout()">Cerrar sesión</button>
      </section>

      <form class="card space-y-5 lg:col-span-3" novalidate (submit)="guardar($event)">
        <div>
          <h2 class="text-xl font-bold text-lila-700">Cambiar contraseña</h2>
          <p class="mt-1 text-sm text-lila-800/75">
            Elige una contraseña que solo tú conozcas: mínimo 8 caracteres, con al menos una letra y un número.
          </p>
        </div>

        <app-password-field id="pf-actual" label="Contraseña actual" autocomplete="current-password"
                            [(valor)]="actual" [error]="errorActual()" (tocado)="tocar('actual')" />

        <app-password-field id="pf-nueva" label="Contraseña nueva" [(valor)]="nueva"
                            [error]="errorNueva()" (tocado)="tocar('nueva')" />

        <app-password-field id="pf-confirmar" label="Repite la contraseña nueva" [(valor)]="confirmar"
                            [error]="errorConfirmar()" (tocado)="tocar('confirmar')" />

        @if (errorServidor(); as e) {
          <p class="rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-bold text-rosa-600" role="alert">{{ e }}</p>
        }

        <button type="submit" class="btn-primary w-full sm:w-auto" [disabled]="guardando()">
          {{ guardando() ? 'Guardando…' : 'Cambiar contraseña' }}
        </button>
      </form>
    </div>
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly actual = signal('');
  readonly nueva = signal('');
  readonly confirmar = signal('');
  readonly guardando = signal(false);
  readonly errorServidor = signal<string | null>(null);

  readonly rol = computed(() => infoRol(this.auth.usuario()?.rol ?? 'USUARIO'));

  private readonly intentado = signal(false);
  private readonly tocados = signal<Campo[]>([]);

  private readonly vActual = computed(() => (this.actual() ? null : 'Escribe tu contraseña actual.'));
  private readonly vNueva = computed(() => {
    const base = validarPassword(this.nueva());
    if (base) return base;
    return this.nueva() === this.actual() ? 'La nueva contraseña debe ser distinta de la actual.' : null;
  });
  private readonly vConfirmar = computed(() =>
    this.confirmar() === this.nueva() ? null : 'No coincide con la contraseña nueva.');

  readonly errorActual = computed(() => (this.visible('actual') ? this.vActual() : null));
  readonly errorNueva = computed(() => (this.visible('nueva') ? this.vNueva() : null));
  readonly errorConfirmar = computed(() => (this.visible('confirmar') ? this.vConfirmar() : null));

  tocar(campo: Campo): void {
    this.tocados.update(t => (t.includes(campo) ? t : [...t, campo]));
  }

  guardar(event: Event): void {
    event.preventDefault();
    if (this.guardando()) return;

    this.intentado.set(true);
    const invalido = this.vActual() ? 'pf-actual'
                   : this.vNueva() ? 'pf-nueva'
                   : this.vConfirmar() ? 'pf-confirmar' : null;
    if (invalido) {
      document.getElementById(invalido)?.focus();
      return;
    }

    this.guardando.set(true);
    this.errorServidor.set(null);

    this.auth.cambiarPassword(this.actual(), this.nueva()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.actual.set('');
        this.nueva.set('');
        this.confirmar.set('');
        this.intentado.set(false);
        this.tocados.set([]);
        this.toast.mostrar('Tu contraseña se actualizó');
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.errorServidor.set(e.errores?.length ? `${e.mensaje}: ${e.errores.join('; ')}` : e.mensaje);
      },
    });
  }

  private visible(campo: Campo): boolean {
    return this.intentado() || this.tocados().includes(campo);
  }
}