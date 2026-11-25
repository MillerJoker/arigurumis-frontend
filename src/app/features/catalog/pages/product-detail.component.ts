import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError } from '../../../core/models/api.model';
import { Producto } from '../../../core/models/catalogo.model';
import { CartService, MAX_CANTIDAD, MAX_DETALLES } from '../../../core/services/cart.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';
import { QuantityStepperComponent } from '../../../shared/components/quantity-stepper.component';
import { ImagenUrlPipe } from '../../../shared/pipes/imagen-url.pipe';

type Carga = { p: Producto | null; e: ApiError | null };

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, ImagenUrlPipe, QuantityStepperComponent],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <a routerLink="/catalogo" class="inline-flex items-center gap-1 font-bold text-lila-600 hover:text-lila-800">
        <span aria-hidden="true">←</span> Volver al catálogo
      </a>

      @if (cargando()) {
        <div class="mt-8 grid gap-10 md:grid-cols-2">
          <div class="aspect-square animate-pulse rounded-3xl bg-lila-100"></div>
          <div class="space-y-4">
            <div class="h-6 w-1/3 animate-pulse rounded-full bg-lila-100"></div>
            <div class="h-10 w-3/4 animate-pulse rounded-full bg-lila-100"></div>
            <div class="h-24 animate-pulse rounded-3xl bg-lila-100"></div>
          </div>
        </div>
      } @else if (producto(); as p) {
        <div class="mt-8 grid items-start gap-10 md:grid-cols-2">
          <div class="relative overflow-hidden rounded-4xl bg-lila-50 ring-1 ring-lila-100">
            <img [src]="p.imagenUrl | imagenUrl" [alt]="p.nombre" class="aspect-square w-full object-cover">
            @if (p.personalizable) {
              <span class="absolute top-4 left-4 rounded-full bg-durazno-200 px-4 py-1.5 text-sm font-extrabold text-lila-800">
                A tu medida
              </span>
            }
          </div>

          <div>
            <p class="text-sm font-extrabold tracking-wide text-lila-600 uppercase">{{ p.categoriaNombre }}</p>
            <h1 class="mt-1 text-3xl font-bold text-lila-800 sm:text-4xl">{{ p.nombre }}</h1>
            <p class="mt-3 text-3xl font-extrabold text-lila-600">
              {{ p.precio | currency: 'USD' : 'symbol' : '1.2-2' }}
            </p>

            @if (p.descripcion) {
              <p class="mt-5 text-lg leading-relaxed whitespace-pre-line text-lila-800/85">{{ p.descripcion }}</p>
            }

            <p class="mt-5 inline-block rounded-full px-4 py-1.5 text-sm font-extrabold"
               [class]="estadoClase()">{{ estadoTexto() }}</p>

            @if (p.disponible) {
              @if (p.personalizable) {
                <div class="mt-6 rounded-3xl bg-durazno-50 p-5 ring-1 ring-durazno-200">
                  <label for="notas" class="block font-extrabold text-lila-800">
                    Cuéntanos cómo lo quieres
                  </label>
                  <p class="mt-1 text-sm text-lila-800/75">
                    Personaje, colores, tamaño, nombre bordado, fecha especial… Entre más detalles, mejor.
                    Confirmaremos todo contigo por WhatsApp antes de empezar a tejer.
                  </p>
                  <textarea id="notas" rows="4" class="input mt-3" [attr.maxlength]="maxDetalles"
                            placeholder="Ej.: conejo gris con lazo rosado, 25 cm, nombre «Luna» bordado"
                            [value]="detalles()" (input)="detalles.set($any($event.target).value)"></textarea>
                  <p class="mt-1 text-right text-xs font-bold text-lila-500">
                    {{ detalles().length }}/{{ maxDetalles }}
                  </p>
                </div>
              }

              <div class="mt-6 flex flex-wrap items-center gap-4">
                <app-quantity-stepper [valor]="cantidad()" [max]="maximo()" (cambio)="cantidad.set($event)" />
                <button type="button" class="btn-primary flex-1 sm:flex-none" (click)="agregar()">
                  Agregar al carrito
                </button>
              </div>

              @if (aviso()) {
                <p class="mt-4 rounded-2xl bg-rosa-100 px-4 py-3 font-semibold text-rosa-600" role="alert">
                  {{ aviso() }}
                </p>
              }
              @if (agregado()) {
                <a routerLink="/catalogo/carrito" class="mt-4 inline-block font-extrabold text-lila-600 hover:text-lila-800">
                  Ver mi carrito →
                </a>
              }
            }
          </div>
        </div>
      } @else {
        <div class="card mx-auto mt-10 max-w-xl text-center">
          <h1 class="text-2xl font-bold text-lila-700">
            {{ noEncontrado() ? 'Este producto no está disponible' : 'No pudimos cargar el producto' }}
          </h1>
          <p class="mt-2 text-lila-800/80">
            {{ noEncontrado() ? 'Puede que ya no esté en el catálogo.' : error() }}
          </p>
          <a routerLink="/catalogo" class="btn-primary mt-6">Ver el catálogo</a>
        </div>
      }
    </section>
  `,
})
export class ProductDetailComponent {
  private readonly productos = inject(ProductoService);
  private readonly carrito = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();     // parámetro de ruta :id

  readonly producto = signal<Producto | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrado = signal(false);
  readonly error = signal<string | null>(null);

  readonly cantidad = signal(1);
  readonly detalles = signal('');
  readonly aviso = signal<string | null>(null);
  readonly agregado = signal(false);
  readonly maxDetalles = MAX_DETALLES;

  readonly maximo = computed(() => {
    const p = this.producto();
    if (!p) return 1;
    return p.personalizable ? MAX_CANTIDAD : Math.max(1, Math.min(p.stock, MAX_CANTIDAD));
  });

  readonly estadoTexto = computed(() => {
    const p = this.producto();
    if (!p) return '';
    if (!p.disponible) return 'Agotado por ahora';
    if (p.personalizable) return 'Lo tejemos especialmente para ti';
    return p.stock <= 5 ? `¡Quedan solo ${p.stock}!` : 'Disponible';
  });

  readonly estadoClase = computed(() => {
    const p = this.producto();
    if (!p || !p.disponible) return 'bg-rosa-100 text-rosa-600';
    return p.personalizable ? 'bg-durazno-100 text-lila-800' : 'bg-menta-100 text-menta-600';
  });

  constructor() {
    toObservable(this.id).pipe(
      tap(() => {
        this.cargando.set(true);
        this.producto.set(null);
        this.noEncontrado.set(false);
        this.error.set(null);
        this.aviso.set(null);
        this.agregado.set(false);
        this.cantidad.set(1);
        this.detalles.set('');
      }),
      switchMap(valor => {
        const n = Number(valor);
        if (!Number.isInteger(n) || n <= 0) {
          return of<Carga>({ p: null, e: { status: 404, mensaje: 'Producto no encontrado' } });
        }
        return this.productos.obtener(n).pipe(
          map((p): Carga => ({ p, e: null })),
          catchError((e: ApiError) => of<Carga>({ p: null, e })),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(({ p, e }) => {
      this.producto.set(p);
      this.noEncontrado.set(e?.status === 404);
      this.error.set(e && e.status !== 404 ? e.mensaje : null);
      this.cargando.set(false);
    });
  }

  agregar(): void {
    const p = this.producto();
    if (!p) return;

    const r = this.carrito.agregar(p, this.cantidad(), this.detalles());
    if (!r.ok) {
      this.aviso.set(r.mensaje);
      return;
    }
    this.aviso.set(null);
    this.agregado.set(true);
    this.toast.mostrar(`«${p.nombre}» se agregó al carrito`);
    this.cantidad.set(1);
    if (p.personalizable) this.detalles.set('');   // listo para añadir otra variante
  }
}