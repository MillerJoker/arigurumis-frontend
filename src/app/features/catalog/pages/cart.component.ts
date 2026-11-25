import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MAX_DETALLES, CartService } from '../../../core/services/cart.service';
import { QuantityStepperComponent } from '../../../shared/components/quantity-stepper.component';
import { ImagenUrlPipe } from '../../../shared/pipes/imagen-url.pipe';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe, ImagenUrlPipe, QuantityStepperComponent],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <h1 class="section-title text-center">Mi carrito</h1>

      @if (avisos().length) {
        <div class="mx-auto mt-6 max-w-3xl space-y-2 rounded-3xl bg-durazno-100 p-5 ring-1 ring-durazno-200" role="status">
          @for (a of avisos(); track a) {
            <p class="font-semibold text-lila-800">{{ a }}</p>
          }
        </div>
      }

      @if (carrito.vacio()) {
        <div class="card mx-auto mt-10 max-w-xl text-center">
          <svg viewBox="0 0 200 200" class="mx-auto size-28" aria-hidden="true">
            <circle cx="100" cy="105" r="62" class="fill-lila-500"/>
            <path d="M52 95c28 14 62 20 98 4M60 140c30-8 60-30 76-70" class="stroke-lila-300" fill="none"
                  stroke-width="9" stroke-linecap="round"/>
            <path d="M60 165c-22 6-36 22-18 30s38-4 56-14" class="stroke-lila-400" fill="none"
                  stroke-width="9" stroke-linecap="round"/>
          </svg>
          <h2 class="mt-4 text-2xl font-bold text-lila-700">Tu carrito está vacío</h2>
          <p class="mt-2 text-lila-800/80">Elige tus piezas favoritas y las tejemos con cariño.</p>
          <a routerLink="/catalogo" class="btn-primary mt-6">Ver productos</a>
        </div>
      } @else {
        <div class="mt-10 grid items-start gap-8 lg:grid-cols-3">
          <ul class="space-y-4 lg:col-span-2">
            @for (item of carrito.items(); track item.id) {
              <li class="card flex flex-col gap-4 sm:flex-row">
                <a [routerLink]="['/catalogo', item.productoId]"
                   class="size-24 shrink-0 overflow-hidden rounded-2xl bg-lila-50 sm:size-28">
                  <img [src]="item.imagenUrl | imagenUrl" [alt]="item.nombre" class="size-full object-cover">
                </a>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-xs font-bold tracking-wide text-lila-600 uppercase">{{ item.categoriaNombre }}</p>
                      <h2 class="text-lg font-bold text-lila-800">{{ item.nombre }}</h2>
                      <p class="text-sm font-semibold text-lila-600">
                        {{ item.precio | currency: 'USD' : 'symbol' : '1.2-2' }} c/u
                      </p>
                    </div>
                    <button type="button" (click)="carrito.quitar(item.id)"
                            class="rounded-full px-3 py-1.5 text-sm font-bold text-rosa-600 hover:bg-rosa-100"
                            [attr.aria-label]="'Quitar ' + item.nombre + ' del carrito'">Quitar</button>
                  </div>

                  @if (item.personalizable) {
                    <div class="mt-3">
                      <label [attr.for]="'notas-' + item.id" class="text-sm font-extrabold text-lila-800">
                        Detalles de tu pieza a medida
                      </label>
                      <textarea [id]="'notas-' + item.id" rows="3" class="input mt-1 text-sm"
                                [attr.maxlength]="maxDetalles"
                                placeholder="Personaje, colores, tamaño, nombre bordado…"
                                [value]="item.detallesPersonalizacion ?? ''"
                                (input)="carrito.cambiarDetalles(item.id, $any($event.target).value)"></textarea>
                      @if (!(item.detallesPersonalizacion ?? '').trim()) {
                        <p class="mt-1 text-sm font-bold text-rosa-600">Cuéntanos los detalles para poder continuar.</p>
                      }
                    </div>
                  }

                  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <app-quantity-stepper [valor]="item.cantidad" [max]="carrito.maximoDe(item)"
                                          (cambio)="carrito.cambiarCantidad(item.id, $event)" />
                    <p class="text-xl font-extrabold text-lila-700">
                      {{ item.precio * item.cantidad | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                  </div>
                </div>
              </li>
            }
          </ul>

          <aside class="card lg:sticky lg:top-24">
            <h2 class="text-xl font-bold text-lila-700">Resumen</h2>
            <dl class="mt-4 space-y-2">
              <div class="flex justify-between">
                <dt>Artículos</dt>
                <dd class="font-bold">{{ carrito.cantidadTotal() }}</dd>
              </div>
              <div class="flex justify-between border-t border-lila-100 pt-3 text-xl">
                <dt class="font-bold text-lila-800">Total</dt>
                <dd class="font-extrabold text-lila-600">
                  {{ carrito.total() | currency: 'USD' : 'symbol' : '1.2-2' }}
                </dd>
              </div>
            </dl>
            <p class="mt-3 text-sm text-lila-800/70">
              No incluye el costo de envío, que coordinamos contigo por WhatsApp.
            </p>

            @if (carrito.detallesIncompletos()) {
              <p class="mt-4 rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-bold text-rosa-600">
                Completa los detalles de tus piezas a medida para continuar.
              </p>
              <button type="button" class="btn-primary mt-4 w-full" disabled>Continuar con el pedido</button>
            } @else {
              <a routerLink="/catalogo/checkout" class="btn-primary mt-4 w-full">Continuar con el pedido</a>
            }

            <a routerLink="/catalogo" class="btn-outline mt-3 w-full">Seguir comprando</a>
            <button type="button" (click)="vaciar()"
                    class="mt-3 w-full text-sm font-bold text-lila-500 hover:text-rosa-600">Vaciar carrito</button>
          </aside>
        </div>
      }
    </section>
  `,
})
export class CartComponent {
  readonly carrito = inject(CartService);
  readonly avisos = signal<string[]>([]);
  readonly maxDetalles = MAX_DETALLES;

  constructor() {
    // Al abrir el carrito se revisan precios y disponibilidad
    this.carrito.sincronizar()
      .pipe(takeUntilDestroyed())
      .subscribe(avisos => this.avisos.set(avisos));
  }

  vaciar(): void {
    if (confirm('¿Quieres vaciar tu carrito?')) this.carrito.vaciar();
  }
}