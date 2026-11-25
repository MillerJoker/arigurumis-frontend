import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Producto } from '../../core/models/catalogo.model';
import { ImagenUrlPipe } from '../pipes/imagen-url.pipe';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, CurrencyPipe, ImagenUrlPipe],
  template: `
    <article class="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg
                    shadow-lila-900/5 ring-1 ring-lila-100 transition hover:-translate-y-1 hover:shadow-xl">
      <a [routerLink]="['/catalogo', producto().id]"
         class="relative block aspect-square overflow-hidden bg-lila-50">
        <img [src]="producto().imagenUrl | imagenUrl" [alt]="producto().nombre" loading="lazy"
             class="size-full object-cover transition duration-500 group-hover:scale-105">
        @if (producto().personalizable) {
          <span class="absolute top-3 left-3 rounded-full bg-durazno-200 px-3 py-1 text-xs font-extrabold text-lila-800">
            A tu medida
          </span>
        } @else if (!producto().disponible) {
          <span class="absolute top-3 left-3 rounded-full bg-rosa-100 px-3 py-1 text-xs font-extrabold text-rosa-600">
            Agotado
          </span>
        }
      </a>

      <div class="flex flex-1 flex-col gap-1 p-5">
        <p class="text-xs font-bold tracking-wide text-lila-600 uppercase">{{ producto().categoriaNombre }}</p>
        <h3 class="text-lg font-bold text-lila-800">{{ producto().nombre }}</h3>
        <p class="mt-auto pt-3 text-xl font-extrabold text-lila-600">
          {{ producto().precio | currency: 'USD' : 'symbol' : '1.2-2' }}
        </p>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  readonly producto = input.required<Producto>();
}