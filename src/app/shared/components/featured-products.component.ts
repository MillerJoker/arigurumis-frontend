import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Producto } from '../../core/models/catalogo.model';
import { ProductoService } from '../../core/services/producto.service';
import { ProductCardComponent } from '../../shared/components/product-card.component';

@Component({
  selector: 'app-featured-products',
  imports: [RouterLink, ProductCardComponent],
  template: `
    <section id="productos" class="scroll-mt-20 bg-white py-16 md:py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center">
          <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Recién tejidos</p>
          <h2 class="section-title mt-2">Lo más nuevo del taller</h2>
        </div>

        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          @if (cargando()) {
            @for (i of esqueleto; track i) {
              <div class="aspect-4/5 animate-pulse rounded-3xl bg-lila-100"></div>
            }
          } @else {
            @for (p of productos(); track p.id) {
              <app-product-card [producto]="p" />
            } @empty {
              <p class="col-span-full rounded-3xl bg-lila-50 p-8 text-center font-semibold text-lila-700">
                {{ error() ? 'No pudimos cargar los productos en este momento.' : 'Pronto tendremos nuevas creaciones. ¡Vuelve a visitarnos!' }}
              </p>
            }
          }
        </div>

        <div class="mt-10 text-center">
          <a routerLink="/catalogo" class="btn-primary">Ver todo el catálogo</a>
        </div>
      </div>
    </section>
  `,
})
export class FeaturedProductsComponent {
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly esqueleto = [1, 2, 3, 4];

  constructor() {
    inject(ProductoService)
      .listar({ tamanio: 4 })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: pagina => { this.productos.set(pagina.contenido); this.cargando.set(false); },
        error: () => { this.error.set(true); this.cargando.set(false); },
      });
  }
}