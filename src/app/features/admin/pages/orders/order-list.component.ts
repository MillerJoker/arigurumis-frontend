import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError, Pagina } from '../../../../core/models/api.model';
import { EstadoPedido, Pedido } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/pedido.service';
import { entero } from '../../../../core/utils/entero';
import { ESTADOS, ESTADO_INFO, esEstado } from '../../../../core/utils/estado-pedido';
import { hace } from '../../../../core/utils/tiempo';

type Carga = { r: Pagina<Pedido> | null; e: string | null };

@Component({
  selector: 'app-order-list',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Gestión</p>
        <h1 class="text-3xl font-bold text-lila-800">Pedidos</h1>
      </div>
      <button type="button" class="btn-outline" (click)="recarga.update(n => n + 1)" [disabled]="cargando()">
        Actualizar
      </button>
    </header>

    <!-- Filtro por estado -->
    <nav class="mt-6 flex flex-wrap gap-2" aria-label="Filtrar por estado">
      <a routerLink="." [queryParams]="{ estado: null, pagina: null }" queryParamsHandling="merge"
         class="rounded-full px-4 py-2 font-bold ring-1 transition"
         [class]="estadoActivo() === null ? 'bg-lila-600 text-white ring-lila-600'
                                          : 'bg-white text-lila-700 ring-lila-200 hover:bg-lila-50'">Todos</a>
      @for (e of estados; track e) {
        <a routerLink="." [queryParams]="{ estado: e, pagina: null }" queryParamsHandling="merge"
           class="rounded-full px-4 py-2 font-bold ring-1 transition"
           [class]="estadoActivo() === e ? 'bg-lila-600 text-white ring-lila-600'
                                         : 'bg-white text-lila-700 ring-lila-200 hover:bg-lila-50'">
          {{ info[e].texto }}
        </a>
      }
    </nav>

    <div class="mt-6" aria-live="polite">
      @if (cargando()) {
        <div class="space-y-3" aria-busy="true">
          @for (i of esqueleto; track i) {
            <div class="h-16 animate-pulse rounded-2xl bg-lila-100"></div>
          }
        </div>
      } @else if (error()) {
        <div class="card text-center">
          <p class="font-bold text-rosa-600" role="alert">{{ error() }}</p>
          <button type="button" class="btn-primary mt-4" (click)="recarga.update(n => n + 1)">Reintentar</button>
        </div>
      } @else if (resultado(); as r) {
        <p class="mb-4 text-sm font-bold text-lila-600">
          {{ r.totalElementos }} {{ r.totalElementos === 1 ? 'pedido' : 'pedidos' }}
        </p>

        @if (r.contenido.length) {
          <!-- Tabla: pantallas medianas y grandes -->
          <div class="hidden overflow-x-auto rounded-3xl bg-white shadow-lg shadow-lila-900/5 ring-1 ring-lila-100 md:block">
            <table class="w-full text-left">
              <caption class="sr-only">Listado de pedidos</caption>
              <thead class="bg-lila-50 text-sm text-lila-700">
                <tr>
                  <th scope="col" class="px-5 py-3 font-extrabold">Pedido</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Fecha</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Cliente</th>
                  <th scope="col" class="px-5 py-3 text-right font-extrabold">Total</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Estado</th>
                  <th scope="col" class="px-5 py-3"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-lila-100">
                @for (p of r.contenido; track p.id) {
                  <tr class="hover:bg-lila-50/60">
                    <td class="px-5 py-4 font-extrabold text-lila-700">#{{ p.id }}</td>
                    <td class="px-5 py-4 text-sm whitespace-nowrap">
                      {{ p.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}
                      <span class="block text-lila-500">{{ hace(p.fechaCreacion) }}</span>
                    </td>
                    <td class="px-5 py-4">
                      <span class="block font-bold text-lila-800">{{ p.nombreCliente }}</span>
                      <span class="block text-sm text-lila-600">{{ p.telefonoCliente }}</span>
                    </td>
                    <td class="px-5 py-4 text-right font-extrabold text-lila-600">
                      {{ p.total | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </td>
                    <td class="px-5 py-4">
                      <span class="rounded-full px-3 py-1 text-xs font-extrabold whitespace-nowrap"
                            [class]="info[p.estado].badge">{{ info[p.estado].texto }}</span>
                    </td>
                    <td class="px-5 py-4 text-right">
                      <a [routerLink]="['/admin/pedidos', p.id]" class="btn-outline px-4! py-2! text-sm!">Ver</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Tarjetas: pantallas pequeñas -->
          <ul class="space-y-3 md:hidden">
            @for (p of r.contenido; track p.id) {
              <li>
                <a [routerLink]="['/admin/pedidos', p.id]" class="card block p-5">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-lg font-extrabold text-lila-700">#{{ p.id }}</span>
                    <span class="rounded-full px-3 py-1 text-xs font-extrabold"
                          [class]="info[p.estado].badge">{{ info[p.estado].texto }}</span>
                  </div>
                  <p class="mt-2 font-bold text-lila-800">{{ p.nombreCliente }}</p>
                  <p class="text-sm text-lila-600">{{ p.telefonoCliente }}</p>
                  <div class="mt-3 flex items-end justify-between gap-3">
                    <p class="text-sm text-lila-500">
                      {{ p.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }}<br>{{ hace(p.fechaCreacion) }}
                    </p>
                    <p class="text-xl font-extrabold text-lila-600">
                      {{ p.total | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                  </div>
                </a>
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
            <h2 class="text-2xl font-bold text-lila-700">No hay pedidos</h2>
            <p class="mt-2 text-lila-800/80">
              {{ estadoActivo() ? 'No hay pedidos en este estado.' : 'Cuando lleguen pedidos aparecerán aquí.' }}
            </p>
          </div>
        }
      }
    </div>
  `,
})
export class OrderListComponent {
  private readonly pedidos = inject(PedidoService);

  // Vienen de los query params (withComponentInputBinding)
  readonly estado = input<string>();
  readonly pagina = input<string>();

  readonly resultado = signal<Pagina<Pedido> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly recarga = signal(0);

  readonly estados = ESTADOS;
  readonly info = ESTADO_INFO;
  readonly hace = hace;
  readonly esqueleto = [1, 2, 3, 4, 5];

  readonly estadoActivo = computed<EstadoPedido | null>(() => {
    const e = this.estado();
    return esEstado(e) ? e : null;
  });
  readonly paginaActual = computed(() => entero(this.pagina()) ?? 0);

  private readonly consulta = computed(() => ({
    estado: this.estadoActivo(),
    pagina: this.paginaActual(),
    recarga: this.recarga(),
  }));

  constructor() {
    toObservable(this.consulta).pipe(
      tap(() => { this.cargando.set(true); this.error.set(null); }),
      switchMap(c => this.pedidos.listar(c.estado, c.pagina).pipe(
        map((r): Carga => ({ r, e: null })),
        catchError((e: ApiError) => of<Carga>({ r: null, e: e.mensaje })),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ r, e }) => {
      this.resultado.set(r);
      this.error.set(e);
      this.cargando.set(false);
    });
  }
}