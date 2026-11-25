import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError } from '../../../../core/models/api.model';
import { EstadoPedido, Pedido } from '../../../../core/models/pedido.model';
import { PedidoService } from '../../../../core/services/pedido.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ESTADOS, ESTADO_INFO, FLUJO, esFinal } from '../../../../core/utils/estado-pedido';
import { telefonoWhatsapp } from '../../../../core/utils/telefono';
import { hace } from '../../../../core/utils/tiempo';

type Carga = { p: Pedido | null; e: ApiError | null };
type Paso = 'hecho' | 'actual' | 'pendiente';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <a routerLink="/admin/pedidos" class="inline-flex items-center gap-1 font-bold text-lila-600 hover:text-lila-800">
      <span aria-hidden="true">←</span> Volver a pedidos
    </a>

    @if (cargando()) {
      <div class="mt-6 space-y-4" aria-busy="true">
        <div class="h-12 w-1/2 animate-pulse rounded-2xl bg-lila-100"></div>
        <div class="h-28 animate-pulse rounded-3xl bg-lila-100"></div>
        <div class="h-64 animate-pulse rounded-3xl bg-lila-100"></div>
      </div>
    } @else if (pedido(); as p) {
      <header class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold text-lila-800">Pedido #{{ p.id }}</h1>
          <p class="text-lila-800/75">
            {{ p.fechaCreacion | date: 'dd/MM/yyyy HH:mm' }} · {{ hace(p.fechaCreacion) }}
          </p>
        </div>
        <span class="rounded-full px-4 py-1.5 font-extrabold" [class]="info[p.estado].badge">
          {{ info[p.estado].texto }}
        </span>
      </header>

      <!-- Progreso -->
      <section class="card mt-6" aria-label="Progreso del pedido">
        @if (p.estado === 'CANCELADO') {
          <p class="rounded-2xl bg-tinta/10 p-4 text-center font-bold text-tinta">
            Este pedido fue cancelado. El stock de los productos con inventario volvió a estar disponible.
          </p>
        } @else {
          <ol class="flex items-start overflow-x-auto pb-1">
            @for (e of flujo; track e; let ultimo = $last) {
              <li class="flex items-start" [class.flex-1]="!ultimo">
                <div class="flex w-20 shrink-0 flex-col items-center gap-1">
                  <span class="grid size-9 place-items-center rounded-full text-sm font-extrabold"
                        [class]="claseCirculo(e)">{{ paso(e) === 'hecho' ? '✓' : $index + 1 }}</span>
                  <span class="text-center text-xs font-bold"
                        [class]="paso(e) === 'pendiente' ? 'text-lila-500' : 'text-lila-800'">
                    {{ info[e].texto }}
                  </span>
                </div>
                @if (!ultimo) {
                  <div class="mt-4 h-1 min-w-4 flex-1 rounded-full"
                       [class]="paso(e) === 'hecho' ? 'bg-menta-300' : 'bg-lila-100'"></div>
                }
              </li>
            }
          </ol>
        }
      </section>

      <div class="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <!-- Productos -->
        <section class="card lg:col-span-2">
          <h2 class="text-xl font-bold text-lila-700">Productos</h2>
          <ul class="mt-4 divide-y divide-lila-100">
            @for (d of p.detalles ?? []; track $index) {
              <li class="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <p class="font-bold text-lila-800">{{ d.productoNombre }}</p>
                  <p class="text-sm text-lila-600">
                    {{ d.cantidad }} × {{ d.precioUnitario | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </p>
                  @if (d.detallesPersonalizacion) {
                    <p class="mt-2 rounded-2xl bg-durazno-50 p-3 text-sm whitespace-pre-line text-lila-800 ring-1 ring-durazno-200">
                      <span class="font-extrabold">A medida:</span> {{ d.detallesPersonalizacion }}
                    </p>
                  }
                </div>
                <p class="text-lg font-extrabold text-lila-700 sm:text-right">
                  {{ d.subtotal | currency: 'USD' : 'symbol' : '1.2-2' }}
                </p>
              </li>
            }
          </ul>
          <div class="mt-2 flex justify-between border-t border-lila-100 pt-4 text-xl">
            <span class="font-bold text-lila-800">Total</span>
            <span class="font-extrabold text-lila-600">{{ p.total | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
          </div>
          <p class="mt-1 text-sm text-lila-800/70">No incluye el envío.</p>
        </section>

        <div class="space-y-6">
          <!-- Cliente -->
          <section class="card">
            <h2 class="text-xl font-bold text-lila-700">Cliente</h2>
            <dl class="mt-4 space-y-3">
              <div>
                <dt class="text-sm font-bold text-lila-500">Nombre</dt>
                <dd class="font-bold text-lila-800">{{ p.nombreCliente }}</dd>
              </div>
              <div>
                <dt class="text-sm font-bold text-lila-500">Teléfono</dt>
                <dd class="font-bold text-lila-800">{{ p.telefonoCliente }}</dd>
              </div>
              <div>
                <dt class="text-sm font-bold text-lila-500">Dirección</dt>
                <dd class="text-lila-800">{{ p.direccionEnvio || 'No indicó dirección: coordinar por WhatsApp' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-bold text-lila-500">Cuenta</dt>
                <dd class="text-lila-800">{{ p.usuarioId ? 'Usuario registrado' : 'Invitado' }}</dd>
              </div>
            </dl>

            @if (enlaceCliente(p); as url) {
              <a [href]="url" target="_blank" rel="noopener noreferrer" class="btn-secondary mt-5 w-full">
                Escribir al cliente por WhatsApp
              </a>
            } @else {
              <p class="mt-4 rounded-2xl bg-lila-50 p-3 text-sm text-lila-700">
                No pudimos armar un enlace de WhatsApp con este teléfono. Llámalo directamente.
              </p>
            }
          </section>

          <!-- Cambiar estado -->
          <section class="card">
            <h2 class="text-xl font-bold text-lila-700">Estado del pedido</h2>

            @if (final()) {
              <p class="mt-3 rounded-2xl bg-lila-50 p-4 text-sm font-semibold text-lila-700">
                Este pedido está finalizado y ya no puede cambiar de estado.
              </p>
            } @else {
              @if (p.estado === 'PENDIENTE_WHATSAPP') {
                <p class="mt-3 rounded-2xl bg-durazno-50 p-3 text-sm text-lila-800 ring-1 ring-durazno-200">
                  Antes de confirmar, acuerda con el cliente por WhatsApp el costo de envío y la forma de pago.
                </p>
              }

              <div class="mt-4 space-y-2">
                @for (e of destinos(); track e) {
                  <button type="button" class="w-full" [class]="claseAccion(e)"
                          [disabled]="cambiando()" (click)="cambiar(e)">
                    {{ info[e].accion }}
                  </button>
                }
              </div>
              <p class="mt-3 text-xs text-lila-800/70">
                Al cancelar, el stock de los productos con inventario vuelve a estar disponible.
              </p>
            }

            @if (errorCambio(); as msg) {
              <p class="mt-4 rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-bold text-rosa-600" role="alert">{{ msg }}</p>
            }
          </section>
        </div>
      </div>
    } @else {
      <div class="card mx-auto mt-10 max-w-xl text-center">
        <h1 class="text-2xl font-bold text-lila-700">
          {{ noEncontrado() ? 'No encontramos este pedido' : 'No pudimos cargar el pedido' }}
        </h1>
        @if (!noEncontrado()) {
          <p class="mt-2 text-lila-800/80">{{ error() }}</p>
        }
        <a routerLink="/admin/pedidos" class="btn-primary mt-6">Ver pedidos</a>
      </div>
    }
  `,
})
export class OrderDetailComponent {
  private readonly pedidos = inject(PedidoService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();      // parámetro de ruta :id

  readonly pedido = signal<Pedido | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrado = signal(false);
  readonly error = signal<string | null>(null);
  readonly cambiando = signal(false);
  readonly errorCambio = signal<string | null>(null);

  readonly info = ESTADO_INFO;
  readonly flujo = FLUJO;
  readonly hace = hace;

  readonly final = computed(() => {
    const p = this.pedido();
    return !!p && esFinal(p.estado);
  });

  private readonly indice = computed(() => {
    const p = this.pedido();
    return p ? FLUJO.indexOf(p.estado) : -1;
  });

  /** Siguiente paso lógico del flujo (se destaca como botón principal). */
  private readonly siguiente = computed<EstadoPedido | undefined>(() => FLUJO[this.indice() + 1]);

  /** Todos los estados a los que se puede pasar (el backend permite saltar pasos). */
  readonly destinos = computed(() => {
    const actual = this.pedido()?.estado;
    return ESTADOS.filter(e => e !== actual);
  });

  constructor() {
    toObservable(this.id).pipe(
      tap(() => {
        this.cargando.set(true);
        this.pedido.set(null);
        this.noEncontrado.set(false);
        this.error.set(null);
        this.errorCambio.set(null);
      }),
      switchMap(valor => {
        const n = Number(valor);
        if (!Number.isInteger(n) || n <= 0) {
          return of<Carga>({ p: null, e: { status: 404, mensaje: 'Pedido no encontrado' } });
        }
        return this.pedidos.obtener(n).pipe(
          map((p): Carga => ({ p, e: null })),
          catchError((e: ApiError) => of<Carga>({ p: null, e })),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(({ p, e }) => {
      this.pedido.set(p);
      this.noEncontrado.set(e?.status === 404);
      this.error.set(e && e.status !== 404 ? e.mensaje : null);
      this.cargando.set(false);
    });
  }

  paso(e: EstadoPedido): Paso {
    const i = FLUJO.indexOf(e);
    const actual = this.indice();
    return i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
  }

  claseCirculo(e: EstadoPedido): string {
    switch (this.paso(e)) {
      case 'hecho': return 'bg-menta-300 text-lila-900';
      case 'actual': return 'bg-lila-600 text-white';
      default: return 'bg-lila-100 text-lila-500';
    }
  }

  claseAccion(e: EstadoPedido): string {
    if (e === 'CANCELADO') return 'btn border-2 border-rosa-300 text-rosa-600 hover:bg-rosa-50';
    return e === this.siguiente() ? 'btn-primary' : 'btn-outline';
  }

  enlaceCliente(p: Pedido): string | null {
    const numero = telefonoWhatsapp(p.telefonoCliente);
    if (!numero) return null;
    const nombre = p.nombreCliente.trim().split(/\s+/)[0];
    const texto = `Hola ${nombre}, te escribimos de Arigurumis sobre tu pedido #${p.id}.`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  cambiar(nuevo: EstadoPedido): void {
    const p = this.pedido();
    if (!p || this.cambiando()) return;

    const aviso =
      nuevo === 'CANCELADO'
        ? `¿Cancelar el pedido #${p.id}? El stock de los productos con inventario se devolverá y el pedido no podrá cambiar de estado después.`
      : nuevo === 'ENTREGADO'
        ? `¿Marcar el pedido #${p.id} como entregado? Es un estado final y no podrá cambiarse después.`
      : null;
    if (aviso && !confirm(aviso)) return;

    this.cambiando.set(true);
    this.errorCambio.set(null);

    this.pedidos.cambiarEstado(p.id, nuevo).subscribe({
      next: actualizado => {
        this.pedido.set(actualizado);
        this.cambiando.set(false);
        this.toast.mostrar(`Pedido #${actualizado.id}: ${ESTADO_INFO[actualizado.estado].texto}`);
      },
      error: (e: ApiError) => {
        this.cambiando.set(false);
        this.errorCambio.set(e.mensaje);
      },
    });
  }
}