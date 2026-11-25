import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError } from '../../../../core/models/api.model';
import { Rol } from '../../../../core/models/auth.model';
import { UsuarioAdmin } from '../../../../core/models/usuario.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { validarPassword } from '../../../../core/utils/password';
import { copiarAlPortapapeles } from '../../../../core/utils/portapapeles';
import { ROLES } from '../../../../core/utils/rol';
import { PasswordFieldComponent } from '../../../../shared/components/password-field.component';

type Campo = 'nombre' | 'correo' | 'telefono' | 'password';
type Carga = { u: UsuarioAdmin | null; e: ApiError | null };

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATRON_TELEFONO = /^[0-9+()\-\s]{7,20}$/;      // mismo patrón que el backend

@Component({
  selector: 'app-user-form',
  imports: [RouterLink, PasswordFieldComponent],
  template: `
    <a routerLink="/admin/usuarios" class="inline-flex items-center gap-1 font-bold text-lila-600 hover:text-lila-800">
      <span aria-hidden="true">←</span> Volver a usuarios
    </a>

    @if (cargando()) {
      <div class="mt-6 space-y-4" aria-busy="true">
        <div class="h-12 w-1/2 animate-pulse rounded-2xl bg-lila-100"></div>
        <div class="h-64 animate-pulse rounded-3xl bg-lila-100"></div>
      </div>
    } @else if (noEncontrado() || errorCarga()) {
      <div class="card mx-auto mt-10 max-w-xl text-center">
        <h1 class="text-2xl font-bold text-lila-700">
          {{ noEncontrado() ? 'No encontramos este usuario' : 'No pudimos cargar el usuario' }}
        </h1>
        @if (errorCarga()) { <p class="mt-2 text-lila-800/80">{{ errorCarga() }}</p> }
        <a routerLink="/admin/usuarios" class="btn-primary mt-6">Ver usuarios</a>
      </div>
    } @else if (creado(); as c) {
      <!-- Cuenta creada: entrega de credenciales -->
      <div class="card mx-auto mt-8 max-w-xl text-center">
        <div class="mx-auto grid size-16 place-items-center rounded-full bg-menta-100" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="size-8 text-menta-600" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
        </div>
        <h1 class="mt-4 text-2xl font-bold text-lila-700">Cuenta creada</h1>
        <p class="mt-1 text-lila-800/80">{{ c.usuario.nombre }} · {{ rolTexto(c.usuario.rol) }}</p>

        <dl class="mt-5 space-y-3 rounded-2xl bg-lila-50 p-4 text-left">
          <div>
            <dt class="text-sm font-bold text-lila-500">Correo</dt>
            <dd class="font-bold break-all text-lila-800 select-all">{{ c.usuario.correo }}</dd>
          </div>
          <div>
            <dt class="text-sm font-bold text-lila-500">Contraseña</dt>
            <dd class="font-mono text-lg font-extrabold break-all text-lila-800 select-all">{{ c.password }}</dd>
          </div>
        </dl>

        <button type="button" class="btn-secondary mt-4" (click)="copiarCredenciales()">Copiar datos de acceso</button>

        <p class="mt-4 rounded-2xl bg-durazno-50 p-3 text-left text-sm text-lila-800 ring-1 ring-durazno-200">
          Esta contraseña <strong>no volverá a mostrarse</strong>. Entrégala por un canal privado y pídele que la
          cambie en <strong>Mi perfil</strong> al ingresar por primera vez.
        </p>

        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" class="btn-outline" (click)="crearOtro()">Crear otro usuario</button>
          <a routerLink="/admin/usuarios" class="btn-primary">Volver a usuarios</a>
        </div>
      </div>
    } @else {
      <h1 class="mt-4 text-3xl font-bold text-lila-800">
        {{ esEdicion() ? 'Editar usuario' : 'Nuevo usuario' }}
      </h1>

      <form class="mt-6 grid items-start gap-6 lg:grid-cols-3" novalidate (submit)="guardar($event)">
        <div class="space-y-5 lg:col-span-2">
          <div class="card space-y-5">
            <div>
              <label for="u-nombre" class="mb-1 block text-sm font-bold text-lila-800">Nombre completo</label>
              <input id="u-nombre" type="text" class="input" maxlength="100" autocomplete="off"
                     [class]="errorNombre() ? 'border-rosa-400!' : ''" [attr.aria-invalid]="!!errorNombre()"
                     [value]="nombre()" (input)="nombre.set($any($event.target).value)" (blur)="tocar('nombre')">
              @if (errorNombre(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
            </div>

            <div>
              <label for="u-correo" class="mb-1 block text-sm font-bold text-lila-800">Correo electrónico</label>
              <input id="u-correo" type="email" class="input" maxlength="150" autocomplete="off"
                     [class]="errorCorreo() ? 'border-rosa-400!' : ''" [attr.aria-invalid]="!!errorCorreo()"
                     [value]="correo()" (input)="correo.set($any($event.target).value)" (blur)="tocar('correo')">
              @if (errorCorreo(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
              <p class="mt-1 text-sm text-lila-800/70">Es el usuario con el que inicia sesión.</p>
            </div>

            <div>
              <label for="u-telefono" class="mb-1 block text-sm font-bold text-lila-800">
                Teléfono <span class="font-semibold text-lila-500">(opcional)</span>
              </label>
              <input id="u-telefono" type="tel" inputmode="tel" class="input" maxlength="20" autocomplete="off"
                     [class]="errorTelefono() ? 'border-rosa-400!' : ''" [attr.aria-invalid]="!!errorTelefono()"
                     [value]="telefono()" (input)="telefono.set($any($event.target).value)" (blur)="tocar('telefono')">
              @if (errorTelefono(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
            </div>

            @if (!esEdicion()) {
              <app-password-field id="u-password" label="Contraseña inicial" [conGenerador]="true"
                                  [(valor)]="password" [error]="errorPassword()"
                                  ayuda="Mínimo 8 caracteres, con al menos una letra y un número. Usa «Generar» para crear una segura."
                                  (tocado)="tocar('password')" />
            }
          </div>
        </div>

        <div class="space-y-5">
          <fieldset class="card space-y-2">
            <legend class="mb-2 text-lg font-bold text-lila-700">Rol</legend>
            @for (r of roles; track r.valor) {
              <label class="flex cursor-pointer items-start gap-3 rounded-2xl p-4 ring-1 ring-lila-100 transition
                            has-checked:bg-lila-50 has-checked:ring-2 has-checked:ring-lila-500"
                     [class.cursor-not-allowed]="rolBloqueado()" [class.opacity-60]="rolBloqueado()">
                <input type="radio" name="rol" class="mt-1 size-4 accent-lila-600" [value]="r.valor"
                       [checked]="rol() === r.valor" [disabled]="rolBloqueado()" (change)="rol.set(r.valor)">
                <span>
                  <span class="block font-extrabold text-lila-800">{{ r.texto }}</span>
                  <span class="block text-sm text-lila-800/75">{{ r.descripcion }}</span>
                </span>
              </label>
            }
            @if (rolBloqueado()) {
              <p class="text-sm font-semibold text-lila-700">No puedes cambiar tu propio rol.</p>
            }
          </fieldset>

          @if (errorServidor(); as e) {
            <div class="rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-semibold text-rosa-600" role="alert">
              <p class="font-extrabold">{{ e.mensaje }}</p>
              @if (e.errores?.length) {
                <ul class="mt-1 list-disc pl-5">
                  @for (x of e.errores; track x) { <li>{{ x }}</li> }
                </ul>
              }
            </div>
          }

          <div class="flex flex-col gap-2">
            <button type="submit" class="btn-primary w-full" [disabled]="guardando()">
              {{ guardando() ? 'Guardando…' : esEdicion() ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
            <a routerLink="/admin/usuarios" class="btn-outline w-full">Cancelar</a>
          </div>
          @if (esEdicion()) {
            <p class="text-sm text-lila-800/70">
              Para cambiar su contraseña o desactivar la cuenta usa los botones del listado.
            </p>
          }
        </div>
      </form>
    }
  `,
})
export class UserFormComponent {
  private readonly router = inject(Router);
  private readonly usuarios = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  /** Parámetro de ruta :id. En "nuevo" no existe. */
  readonly id = input<string>();
  readonly esEdicion = computed(() => this.id() !== undefined);
  readonly esYo = computed(() => {
    const id = this.id();
    return id !== undefined && this.auth.usuario()?.id === Number(id);
  });
  readonly rolBloqueado = computed(() => this.esYo());

  readonly roles = ROLES;
  readonly cargando = signal(true);
  readonly noEncontrado = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly guardando = signal(false);
  readonly errorServidor = signal<ApiError | null>(null);
  readonly creado = signal<{ usuario: UsuarioAdmin; password: string } | null>(null);

  readonly nombre = signal('');
  readonly correo = signal('');
  readonly telefono = signal('');
  readonly password = signal('');
  readonly rol = signal<Rol>('VENDEDOR');

  private readonly intentado = signal(false);
  private readonly tocados = signal<Campo[]>([]);

  private readonly vNombre = computed(() => {
    const v = this.nombre().trim();
    if (!v) return 'Escribe el nombre.';
    return v.length > 100 ? 'Máximo 100 caracteres.' : null;
  });
  private readonly vCorreo = computed(() => {
    const v = this.correo().trim();
    if (!v) return 'Escribe el correo.';
    if (v.length > 150) return 'Máximo 150 caracteres.';
    return PATRON_CORREO.test(v) ? null : 'Ingresa un correo válido.';
  });
  private readonly vTelefono = computed(() => {
    const v = this.telefono().trim();
    return !v || PATRON_TELEFONO.test(v) ? null : 'Ingresa un teléfono válido, por ejemplo 0991234567.';
  });
  private readonly vPassword = computed(() => (this.esEdicion() ? null : validarPassword(this.password())));

  readonly errorNombre = computed(() => (this.visible('nombre') ? this.vNombre() : null));
  readonly errorCorreo = computed(() => (this.visible('correo') ? this.vCorreo() : null));
  readonly errorTelefono = computed(() => (this.visible('telefono') ? this.vTelefono() : null));
  readonly errorPassword = computed(() => (this.visible('password') ? this.vPassword() : null));

  constructor() {
    toObservable(this.id).pipe(
      tap(() => {
        this.cargando.set(true);
        this.noEncontrado.set(false);
        this.errorCarga.set(null);
      }),
      switchMap(valor => {
        if (valor === undefined) return of<Carga>({ u: null, e: null });      // usuario nuevo
        const n = Number(valor);
        if (!Number.isInteger(n) || n <= 0) {
          return of<Carga>({ u: null, e: { status: 404, mensaje: 'Usuario no encontrado' } });
        }
        return this.usuarios.obtener(n).pipe(
          map((u): Carga => ({ u, e: null })),
          catchError((e: ApiError) => of<Carga>({ u: null, e })),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(({ u, e }) => {
      if (u) {
        this.nombre.set(u.nombre);
        this.correo.set(u.correo);
        this.telefono.set(u.telefono ?? '');
        this.rol.set(u.rol);
      }
      this.noEncontrado.set(e?.status === 404);
      this.errorCarga.set(e && e.status !== 404 ? e.mensaje : null);
      this.cargando.set(false);
    });
  }

  rolTexto(rol: Rol): string {
    return ROLES.find(r => r.valor === rol)?.texto ?? rol;
  }

  tocar(campo: Campo): void {
    this.tocados.update(t => (t.includes(campo) ? t : [...t, campo]));
  }

  guardar(event: Event): void {
    event.preventDefault();
    if (this.guardando()) return;

    this.intentado.set(true);
    const invalido = this.vNombre() ? 'u-nombre'
                   : this.vCorreo() ? 'u-correo'
                   : this.vTelefono() ? 'u-telefono'
                   : this.vPassword() ? 'u-password' : null;
    if (invalido) {
      document.getElementById(invalido)?.focus();
      return;
    }

    const base = {
      nombre: this.nombre().trim(),
      correo: this.correo().trim().toLowerCase(),
      telefono: this.telefono().trim() || undefined,
      rol: this.rol(),
    };

    this.guardando.set(true);
    this.errorServidor.set(null);

    const id = this.id();
    if (id === undefined) {
      const password = this.password();
      this.usuarios.crear({ ...base, password }).subscribe({
        next: u => {
          this.guardando.set(false);
          this.password.set('');
          this.creado.set({ usuario: u, password });
        },
        error: (e: ApiError) => {
          this.guardando.set(false);
          this.errorServidor.set(e);
        },
      });
    } else {
      this.usuarios.actualizar(Number(id), base).subscribe({
        next: u => {
          // Si editaste tu propia cuenta, el menú debe mostrar tus datos nuevos
          if (this.esYo()) this.auth.actualizarDatos(u.nombre, u.correo);
          this.toast.mostrar(`${u.nombre} se actualizó`);
          this.router.navigate(['/admin/usuarios']);
        },
        error: (e: ApiError) => {
          this.guardando.set(false);
          this.errorServidor.set(e);
        },
      });
    }
  }

  async copiarCredenciales(): Promise<void> {
    const c = this.creado();
    if (!c) return;
    const ok = await copiarAlPortapapeles(`Correo: ${c.usuario.correo}\nContraseña: ${c.password}`);
    this.toast.mostrar(ok ? 'Datos de acceso copiados' : 'No se pudo copiar. Selecciónalos a mano.', ok ? 'ok' : 'error');
  }

  crearOtro(): void {
    this.creado.set(null);
    this.nombre.set('');
    this.correo.set('');
    this.telefono.set('');
    this.password.set('');
    this.rol.set('VENDEDOR');
    this.errorServidor.set(null);
    this.intentado.set(false);
    this.tocados.set([]);
  }

  private visible(campo: Campo): boolean {
    return this.intentado() || this.tocados().includes(campo);
  }
}