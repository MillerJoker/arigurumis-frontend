import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError, Pagina } from '../../../../core/models/api.model';
import { Rol } from '../../../../core/models/auth.model';
import { UsuarioAdmin } from '../../../../core/models/usuario.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { entero } from '../../../../core/utils/entero';
import { validarPassword } from '../../../../core/utils/password';
import { copiarAlPortapapeles } from '../../../../core/utils/portapapeles';
import { ROLES, esRol, infoRol } from '../../../../core/utils/rol';
import { PasswordFieldComponent } from '../../../../shared/components/password-field.component';

type Carga = { r: Pagina<UsuarioAdmin> | null; e: string | null };

@Component({
  selector: 'app-user-manage',
  imports: [RouterLink, NgTemplateOutlet, PasswordFieldComponent],
  host: { '(document:keydown.escape)': 'cerrarReset()' },
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Administración</p>
        <h1 class="text-3xl font-bold text-lila-800">Usuarios</h1>
      </div>
      <a routerLink="/admin/usuarios/nuevo" class="btn-primary">+ Nuevo usuario</a>
    </header>

    <form class="mt-6 flex flex-col gap-3 sm:flex-row" role="search" (submit)="buscar($event)">
      <label for="us-q" class="sr-only">Buscar usuarios</label>
      <input id="us-q" type="search" class="input" placeholder="Buscar por nombre o correo…"
             [value]="busqueda()" (input)="busqueda.set($any($event.target).value)">
      <label for="us-rol" class="sr-only">Rol</label>
      <select id="us-rol" class="input sm:max-w-56" (change)="elegirRol($any($event.target).value)">
        <option value="" [selected]="rolActivo() === null">Todos los roles</option>
        @for (r of roles; track r.valor) {
          <option [value]="r.valor" [selected]="rolActivo() === r.valor">{{ r.texto }}</option>
        }
      </select>
      <button type="submit" class="btn-primary shrink-0">Buscar</button>
    </form>

    <nav class="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por estado">
      @for (f of filtrosEstado; track f.texto) {
        <a routerLink="." [queryParams]="{ activo: f.valor, pagina: null }" queryParamsHandling="merge"
           class="rounded-full px-4 py-2 font-bold ring-1 transition"
           [class]="activoFiltro() === f.bool ? 'bg-lila-600 text-white ring-lila-600'
                                               : 'bg-white text-lila-700 ring-lila-200 hover:bg-lila-50'">
          {{ f.texto }}
        </a>
      }
    </nav>

    <div class="mt-6" aria-live="polite">
      @if (cargando()) {
        <div class="space-y-3" aria-busy="true">
          @for (i of esqueleto; track i) {
            <div class="h-20 animate-pulse rounded-2xl bg-lila-100"></div>
          }
        </div>
      } @else if (error()) {
        <div class="card text-center">
          <p class="font-bold text-rosa-600" role="alert">{{ error() }}</p>
          <button type="button" class="btn-primary mt-4" (click)="recarga.update(n => n + 1)">Reintentar</button>
        </div>
      } @else if (resultado(); as r) {
        <p class="mb-4 text-sm font-bold text-lila-600">
          {{ r.totalElementos }} {{ r.totalElementos === 1 ? 'usuario' : 'usuarios' }}
        </p>

        @if (r.contenido.length) {
          <!-- Tabla: pantallas medianas y grandes -->
          <div class="hidden overflow-x-auto rounded-3xl bg-white shadow-lg shadow-lila-900/5 ring-1 ring-lila-100 md:block">
            <table class="w-full text-left">
              <caption class="sr-only">Listado de usuarios</caption>
              <thead class="bg-lila-50 text-sm text-lila-700">
                <tr>
                  <th scope="col" class="px-5 py-3 font-extrabold">Usuario</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Contacto</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Rol</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Estado</th>
                  <th scope="col" class="px-5 py-3"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-lila-100">
                @for (u of r.contenido; track u.id) {
                  <tr class="hover:bg-lila-50/60" [class.opacity-60]="!u.activo">
                    <td class="px-5 py-4">
                      <span class="font-bold text-lila-800">{{ u.nombre }}</span>
                      @if (esYo(u)) {
                        <span class="ml-2 rounded-full bg-durazno-200 px-2 py-0.5 text-xs font-extrabold text-lila-900">Tú</span>
                      }
                    </td>
                    <td class="px-5 py-4 text-sm">
                      <span class="block text-lila-800">{{ u.correo }}</span>
                      <span class="block text-lila-600">{{ u.telefono || 'Sin teléfono' }}</span>
                    </td>
                    <td class="px-5 py-4">
                      <span class="rounded-full px-3 py-1 text-xs font-extrabold" [class]="infoRol(u.rol).badge">
                        {{ infoRol(u.rol).texto }}
                      </span>
                    </td>
                    <td class="px-5 py-4">
                      <span class="rounded-full px-3 py-1 text-xs font-extrabold"
                            [class]="u.activo ? 'bg-menta-200 text-lila-900' : 'bg-tinta/10 text-tinta'">
                        {{ u.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-5 py-4">
                      <ng-container [ngTemplateOutlet]="acciones" [ngTemplateOutletContext]="{ $implicit: u }" />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Tarjetas: pantallas pequeñas -->
          <ul class="space-y-3 md:hidden">
            @for (u of r.contenido; track u.id) {
              <li class="card p-5" [class.opacity-70]="!u.activo">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-lg font-bold text-lila-800">{{ u.nombre }}</span>
                  @if (esYo(u)) {
                    <span class="rounded-full bg-durazno-200 px-2 py-0.5 text-xs font-extrabold text-lila-900">Tú</span>
                  }
                </div>
                <p class="mt-1 text-sm break-all text-lila-800">{{ u.correo }}</p>
                <p class="text-sm text-lila-600">{{ u.telefono || 'Sin teléfono' }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="rounded-full px-3 py-1 text-xs font-extrabold" [class]="infoRol(u.rol).badge">
                    {{ infoRol(u.rol).texto }}
                  </span>
                  <span class="rounded-full px-3 py-1 text-xs font-extrabold"
                        [class]="u.activo ? 'bg-menta-200 text-lila-900' : 'bg-tinta/10 text-tinta'">
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
                <div class="mt-4">
                  <ng-container [ngTemplateOutlet]="acciones" [ngTemplateOutletContext]="{ $implicit: u }" />
                </div>
              </li>
            }
          </ul>

          @if (r.totalPaginas > 1) {
            <nav class="mt-8 flex items-center justify-center gap-4" aria-label="Paginación">
              <a routerLink="." [queryParams]="{ pagina: paginaActual() - 1 || null }" queryParamsHandling="merge"
                 class="btn-outline" [class.pointer-events-none]="paginaActual() === 0"
                 [class.opacity-50]="paginaActual() === 0">Anterior</a>
              <span class="font-bold text-lila-700">Página {{ paginaActual() + 1 }} de {{ r.totalPaginas }}</span>
              <a routerLink="." [queryParams]="{ pagina: paginaActual() + 1 }" queryParamsHandling="merge"
                 class="btn-outline" [class.pointer-events-none]="paginaActual() + 1 >= r.totalPaginas"
                 [class.opacity-50]="paginaActual() + 1 >= r.totalPaginas">Siguiente</a>
            </nav>
          }
        } @else {
          <div class="card text-center">
            <h2 class="text-2xl font-bold text-lila-700">No hay usuarios</h2>
            <p class="mt-2 text-lila-800/80">
              {{ hayFiltros() ? 'Ningún usuario coincide con los filtros.' : 'Crea el primero con «Nuevo usuario».' }}
            </p>
            @if (hayFiltros()) {
              <button type="button" class="btn-outline mt-5" (click)="limpiar()">Quitar filtros</button>
            }
          </div>
        }
      }
    </div>

    <!-- Acciones de cada usuario (se reutilizan en la tabla y en las tarjetas) -->
    <ng-template #acciones let-u>
      <div class="flex flex-wrap items-center gap-2">
        <a [routerLink]="['/admin/usuarios', u.id, 'editar']" class="btn-outline px-4! py-2! text-sm!">Editar</a>
        <button type="button" class="btn-outline px-4! py-2! text-sm!" (click)="abrirReset(u)">Contraseña</button>
        <button type="button" class="btn-secondary px-4! py-2! text-sm!"
                [disabled]="ocupado() === u.id || esYo(u)" (click)="alternar(u)"
                [attr.title]="esYo(u) ? 'No puedes desactivar tu propia cuenta' : null">
          {{ u.activo ? 'Desactivar' : 'Activar' }}
        </button>
        <button type="button" (click)="eliminar(u)" [disabled]="esYo(u)"
                [attr.title]="esYo(u) ? 'No puedes eliminar tu propia cuenta' : null"
                class="rounded-full px-3 py-2 text-sm font-bold text-rosa-600 hover:bg-rosa-100
                       disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">Eliminar</button>
      </div>
    </ng-template>

    <!-- Restablecer contraseña -->
    @if (resetDe(); as u) {
      <div class="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true"
           aria-labelledby="reset-titulo">
        <div class="absolute inset-0 bg-lila-900/60" (click)="cerrarReset()"></div>

        <div class="relative max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
          @if (resetListo()) {
            <div class="text-center">
              <div class="mx-auto grid size-16 place-items-center rounded-full bg-menta-100" aria-hidden="true">
                <svg viewBox="0 0 24 24" class="size-8 text-menta-600" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 id="reset-titulo" class="mt-4 text-xl font-bold text-lila-700">Contraseña actualizada</h2>
              <p class="mt-1 text-sm text-lila-800/75">Nueva contraseña de {{ u.nombre }}:</p>
              <p class="mt-3 rounded-2xl bg-lila-50 px-4 py-3 font-mono text-lg font-extrabold break-all
                        text-lila-800 select-all">{{ resetPass() }}</p>
              <button type="button" class="btn-secondary mt-3" (click)="copiarReset()">Copiar contraseña</button>
              <p class="mt-4 rounded-2xl bg-durazno-50 p-3 text-left text-sm text-lila-800 ring-1 ring-durazno-200">
                Entrégala por un canal privado y pídele que la cambie en <strong>Mi perfil</strong> al ingresar.
                Su sesión actual, si la tiene abierta, sigue activa hasta que expire.
              </p>
              <button type="button" class="btn-primary mt-5 w-full" (click)="cerrarReset()">Listo</button>
            </div>
          } @else {
            <form novalidate (submit)="guardarReset($event)">
              <h2 id="reset-titulo" class="text-xl font-bold text-lila-700">Restablecer contraseña</h2>
              <p class="mt-1 text-sm text-lila-800/75">Para {{ u.nombre }} ({{ u.correo }})</p>

              <div class="mt-5">
                <app-password-field id="reset-pass" label="Nueva contraseña" [conGenerador]="true"
                                    [(valor)]="resetPass" [error]="errorResetPass()"
                                    ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
                                    (tocado)="resetTocado.set(true)" />
              </div>

              @if (resetError(); as e) {
                <p class="mt-4 rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-bold text-rosa-600" role="alert">{{ e }}</p>
              }

              <div class="mt-6 flex flex-wrap justify-end gap-2">
                <button type="button" class="btn-outline" (click)="cerrarReset()" [disabled]="resetEnviando()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="resetEnviando()">
                  {{ resetEnviando() ? 'Guardando…' : 'Guardar contraseña' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
})
export class UserManageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly usuarios = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  // Vienen de los query params (withComponentInputBinding)
  readonly q = input<string>();
  readonly rol = input<string>();
  readonly activo = input<string>();
  readonly pagina = input<string>();

  readonly resultado = signal<Pagina<UsuarioAdmin> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly recarga = signal(0);
  readonly ocupado = signal<number | null>(null);

  readonly roles = ROLES;
  readonly infoRol = infoRol;
  readonly esqueleto = [1, 2, 3, 4];
  readonly filtrosEstado = [
    { texto: 'Todos', valor: null, bool: null },
    { texto: 'Activos', valor: 'true', bool: true },
    { texto: 'Inactivos', valor: 'false', bool: false },
  ];

  readonly rolActivo = computed<Rol | null>(() => {
    const r = this.rol();
    return esRol(r) ? r : null;
  });
  readonly activoFiltro = computed<boolean | null>(() =>
    this.activo() === 'true' ? true : this.activo() === 'false' ? false : null);
  readonly paginaActual = computed(() => entero(this.pagina()) ?? 0);
  readonly hayFiltros = computed(() =>
    this.rolActivo() !== null || this.activoFiltro() !== null || !!this.q()?.trim());

  private readonly consulta = computed(() => ({
    filtro: {
      q: this.q()?.trim() || undefined,
      rol: this.rolActivo() ?? undefined,
      activo: this.activoFiltro() ?? undefined,
      pagina: this.paginaActual(),
      tamanio: 15,
    },
    recarga: this.recarga(),
  }));

  // Restablecer contraseña
  readonly resetDe = signal<UsuarioAdmin | null>(null);
  readonly resetPass = signal('');
  readonly resetTocado = signal(false);
  readonly resetEnviando = signal(false);
  readonly resetError = signal<string | null>(null);
  readonly resetListo = signal(false);
  readonly errorResetPass = computed(() =>
    this.resetTocado() ? validarPassword(this.resetPass()) : null);

  constructor() {
    toObservable(this.consulta).pipe(
      tap(() => { this.cargando.set(true); this.error.set(null); }),
      switchMap(c => this.usuarios.listar(c.filtro).pipe(
        map((r): Carga => ({ r, e: null })),
        catchError((e: ApiError) => of<Carga>({ r: null, e: e.mensaje })),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ r, e }) => {
      this.resultado.set(r);
      this.error.set(e);
      this.cargando.set(false);
    });

    toObservable(this.q).pipe(takeUntilDestroyed()).subscribe(v => this.busqueda.set(v ?? ''));
  }

  esYo(u: UsuarioAdmin): boolean {
    return this.auth.usuario()?.id === u.id;
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.navegar({ q: this.busqueda().trim() || null, pagina: null });
  }

  elegirRol(valor: string): void {
    this.navegar({ rol: valor || null, pagina: null });
  }

  limpiar(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  // ---------- Activar, desactivar y eliminar ----------

  alternar(u: UsuarioAdmin): void {
    if (this.ocupado() !== null || this.esYo(u)) return;
    if (u.activo && !confirm(
        `¿Desactivar a ${u.nombre}?\n\nNo podrá iniciar sesión y, si tiene una sesión abierta, se cerrará de inmediato.`)) {
      return;
    }

    this.ocupado.set(u.id);
    this.usuarios.cambiarActivo(u.id, !u.activo).subscribe({
      next: act => {
        this.ocupado.set(null);
        this.resultado.update(r => r && {
          ...r,
          contenido: r.contenido.map(x => (x.id === act.id ? act : x)),
        });
        this.toast.mostrar(act.activo ? `${act.nombre} ya puede ingresar` : `${act.nombre} fue desactivado`);
      },
      error: (e: ApiError) => {
        this.ocupado.set(null);
        this.toast.mostrar(e.mensaje, 'error');
      },
    });
  }

  eliminar(u: UsuarioAdmin): void {
    if (this.esYo(u)) return;
    const aviso = `¿Eliminar a ${u.nombre} definitivamente? No se puede deshacer.\n\n`
                + 'Si tiene pedidos asociados el sistema no lo permitirá: en ese caso, desactívalo.';
    if (!confirm(aviso)) return;

    this.usuarios.eliminar(u.id, true).subscribe({
      next: () => {
        this.toast.mostrar(`${u.nombre} se eliminó`);
        this.recarga.update(n => n + 1);
      },
      error: (e: ApiError) => this.toast.mostrar(e.mensaje, 'error'),
    });
  }

  // ---------- Restablecer contraseña ----------

  abrirReset(u: UsuarioAdmin): void {
    this.resetDe.set(u);
    this.resetPass.set('');
    this.resetTocado.set(false);
    this.resetError.set(null);
    this.resetListo.set(false);
    setTimeout(() => document.getElementById('reset-pass')?.focus());
  }

  cerrarReset(): void {
    if (!this.resetDe() || this.resetEnviando()) return;
    this.resetDe.set(null);
    this.resetPass.set('');           // no se conserva la contraseña en memoria
    this.resetListo.set(false);
  }

  guardarReset(event: Event): void {
    event.preventDefault();
    const u = this.resetDe();
    if (!u || this.resetEnviando()) return;

    this.resetTocado.set(true);
    if (validarPassword(this.resetPass())) {
      document.getElementById('reset-pass')?.focus();
      return;
    }

    this.resetEnviando.set(true);
    this.resetError.set(null);
    this.usuarios.restablecerPassword(u.id, this.resetPass()).subscribe({
      next: () => {
        this.resetEnviando.set(false);
        this.resetListo.set(true);
      },
      error: (e: ApiError) => {
        this.resetEnviando.set(false);
        this.resetError.set(e.errores?.length ? `${e.mensaje}: ${e.errores.join('; ')}` : e.mensaje);
      },
    });
  }

  async copiarReset(): Promise<void> {
    const ok = await copiarAlPortapapeles(this.resetPass());
    this.toast.mostrar(ok ? 'Contraseña copiada' : 'No se pudo copiar. Selecciónala a mano.', ok ? 'ok' : 'error');
  }

  // Un valor null elimina el parámetro de la URL
  private navegar(cambios: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: cambios, queryParamsHandling: 'merge' });
  }
}