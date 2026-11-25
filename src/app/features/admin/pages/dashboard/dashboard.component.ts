import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../../core/models/api.model';
import { Estadisticas } from '../../../../core/models/admin.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EstadisticasService } from '../../../../core/services/estadisticas.service';
import { ESTADOS, ESTADO_INFO } from '../../../../core/utils/estado-pedido';
import { diasDesde, hace } from '../../../../core/utils/tiempo';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Panel</p>
        <h1 class="text-3xl font-bold text-lila-800">¡Hola, {{ primerNombre() }}!</h1>
        <p class="text-lila-800/75">Así va el taller hoy.</p>
      </div>
      <button type="button" class="btn-outline" (click)="cargar()" [disabled]="cargando()">
        {{ cargando() ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    @if (error()) {
      <div class="card mt-8 text-center">
        <p class="font-bold text-rosa-600" role="alert">{{ error() }}</p>
        <button type="button" class="btn-primary mt-4" (click)="cargar()">Reintentar</button>
      </div>
    } @else if (datos(); as d) {
      <!-- Indicadores -->
      <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <a routerLink="/admin/pedidos" [queryParams]="{ estado: 'PENDIENTE_WHATSAPP' }"
           class="rounded-3xl bg-durazno-100 p-5 ring-1 ring-durazno-200 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p class="text-sm font-extrabold text-lila-800">Pedidos pendientes</p>
          <p class="mt-1 font-display text-4xl font-bold text-lila-800">{{ d.pedidosPorEstado.PENDIENTE_WHATSAPP }}</p>
          <p class="mt-1 text-sm text-lila-800/75">Esperando confirmación</p>
        </a>

        <a routerLink="/admin/pedidos" [queryParams]="{ estado: 'EN_PRODUCCION' }"
           class="rounded-3xl bg-rosa-100 p-5 ring-1 ring-rosa-200 transition hover:-translate-y-0.5 hover:shadow-lg">
          <p class="text-sm font-extrabold text-lila-800">En producción</p>
          <p class="mt-1 font-display text-4xl font-bold text-lila-800">{{ d.pedidosPorEstado.EN_PRODUCCION }}</p>
          <p class="mt-1 text-sm text-lila-800/75">Tejiéndose ahora</p>
        </a>

        <div class="rounded-3xl bg-menta-100 p-5 ring-1 ring-menta-200">
          <p class="text-sm font-extrabold text-lila-800">Ingresos del mes</p>
          <p class="mt-1 font-display text-4xl font-bold text-lila-800">
            {{ d.ingresosMes | currency: 'USD' : 'symbol' : '1.2-2' }}
          </p>
          <p class="mt-1 text-sm text-lila-800/75">
            Desde el {{ d.ingresosDesde | date: 'dd/MM' }}, sin envíos ni pedidos pendientes o cancelados
          </p>
        </div>

        <div class="rounded-3xl bg-lila-100 p-5 ring-1 ring-lila-200">
          <p class="text-sm font-extrabold text-lila-800">Productos activos</p>
          <p class="mt-1 font-display text-4xl font-bold text-lila-800">{{ d.productosActivos }}</p>
          <p class="mt-1 text-sm text-lila-800/75">{{ d.productosInactivos }} desactivado(s)</p>
        </div>
      </div>

      <!-- Pedidos por estado -->
      <section class="card mt-8">
        <h2 class="text-xl font-bold text-lila-700">Pedidos por estado</h2>
        <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          @for (e of estados; track e) {
            <li>
              <a routerLink="/admin/pedidos" [queryParams]="{ estado: e }"
                 class="block rounded-2xl p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md"
                 [class]="info[e].badge">
                <span class="block font-display text-2xl font-bold">{{ d.pedidosPorEstado[e] }}</span>
                <span class="block text-xs font-extrabold">{{ info[e].texto }}</span>
              </a>
            </li>
          }
        </ul>
      </section>

      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <!-- Pendientes más antiguos -->
        <section class="card">
          <h2 class="text-xl font-bold text-lila-700">Pendientes más antiguos</h2>
          <p class="mt-1 text-sm text-lila-800/70">
            Mientras no se confirmen o cancelen, retienen stock de los productos con inventario.
          </p>

          @if (d.pendientesAntiguos.length) {
            <ul class="mt-4 divide-y divide-lila-100">
              @for (p of d.pendientesAntiguos; track p.id) {
                <li>
                  <a [routerLink]="['/admin/pedidos', p.id]"
                     class="flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-lila-50">
                    <span class="font-extrabold text-lila-700">#{{ p.id }}</span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-bold text-lila-800">{{ p.nombreCliente }}</span>
                      <span class="block text-sm text-lila-600">{{ hace(p.fechaCreacion) }}</span>
                    </span>
                    @if (diasDesde(p.fechaCreacion) >= 2) {
                      <span class="rounded-full bg-rosa-200 px-2.5 py-0.5 text-xs font-extrabold text-lila-900">Revisar</span>
                    }
                    <span class="font-extrabold text-lila-600">
                      {{ p.total | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </span>
                  </a>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-4 rounded-2xl bg-menta-100 p-4 text-center font-bold text-lila-800">
              ¡Todo al día! No hay pedidos pendientes.
            </p>
          }
        </section>

        <!-- Stock bajo -->
        <section class="card">
          <h2 class="text-xl font-bold text-lila-700">Poco stock</h2>
          <p class="mt-1 text-sm text-lila-800/70">
            Productos activos con {{ d.umbralStock }} unidades o menos (no incluye los a medida).
          </p>

          @if (d.productosStockBajo.length) {
            <ul class="mt-4 divide-y divide-lila-100">
              @for (p of d.productosStockBajo; track p.id) {
                <li class="flex items-center justify-between gap-3 px-2 py-3">
                  <span class="min-w-0 flex-1 truncate font-bold text-lila-800">{{ p.nombre }}</span>
                  <span class="rounded-full px-3 py-0.5 text-sm font-extrabold text-lila-900"
                        [class]="p.stock === 0 ? 'bg-rosa-200' : 'bg-durazno-200'">
                    {{ p.stock === 0 ? 'Agotado' : p.stock + (p.stock === 1 ? ' unidad' : ' unidades') }}
                  </span>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-4 rounded-2xl bg-menta-100 p-4 text-center font-bold text-lila-800">
              Ningún producto con poco stock.
            </p>
          }
        </section>
      </div>
    } @else {
      <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        @for (i of esqueleto; track i) {
          <div class="h-32 animate-pulse rounded-3xl bg-lila-100"></div>
        }
      </div>
    }
  `,
})
export class DashboardComponent {
  private readonly api = inject(EstadisticasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  readonly datos = signal<Estadisticas | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly estados = ESTADOS;
  readonly info = ESTADO_INFO;
  readonly hace = hace;
  readonly diasDesde = diasDesde;
  readonly esqueleto = [1, 2, 3, 4];

  readonly primerNombre = computed(() =>
    this.auth.usuario()?.nombre.trim().split(/\s+/)[0] ?? '');

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.obtener()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => { this.datos.set(d); this.cargando.set(false); },
        error: (e: ApiError) => { this.error.set(e.mensaje); this.cargando.set(false); },
      });
  }
}