import { Component, input, output } from '@angular/core';
import { Categoria } from '../../../core/models/catalogo.model';

@Component({
  selector: 'app-category-filter',
  template: `
    <div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por categoría">
      <button type="button" (click)="seleccionar.emit(null)" [attr.aria-pressed]="seleccionada() === null"
              class="rounded-full px-4 py-2 font-bold ring-1 transition"
              [class]="seleccionada() === null ? activo : inactivo">Todos</button>
      @for (c of categorias(); track c.id) {
        <button type="button" (click)="seleccionar.emit(c.id)" [attr.aria-pressed]="seleccionada() === c.id"
                class="rounded-full px-4 py-2 font-bold ring-1 transition"
                [class]="seleccionada() === c.id ? activo : inactivo">{{ c.nombre }}</button>
      }
    </div>
  `,
})
export class CategoryFilterComponent {
  readonly categorias = input.required<Categoria[]>();
  readonly seleccionada = input<number | null>(null);
  readonly seleccionar = output<number | null>();

  readonly activo = 'bg-lila-600 text-white ring-lila-600';
  readonly inactivo = 'bg-white text-lila-700 ring-lila-200 hover:bg-lila-50';
}