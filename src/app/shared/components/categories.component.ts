import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../core/models/catalogo.model';
import { CategoriaService } from '../../core/services/categoria.service';

@Component({
  selector: 'app-categories',
  imports: [RouterLink],
  template: `
    @if (categorias().length) {
      <section class="bg-lila-50/60 py-16 md:py-20">
        <div class="mx-auto max-w-6xl px-6">
          <div class="text-center">
            <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Nuestras creaciones</p>
            <h2 class="section-title mt-2">Encuentra tu favorito</h2>
          </div>

          <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (c of categorias(); track c.id) {
              <a routerLink="/catalogo" [queryParams]="{ categoriaId: c.id }"
                 class="group rounded-3xl p-7 text-lila-800 transition hover:-translate-y-1 hover:shadow-lg"
                 [class]="estilos[$index % estilos.length]">
                <h3 class="text-2xl font-bold">{{ c.nombre }}</h3>
                @if (c.descripcion) {
                  <p class="mt-2 text-lila-800/80">{{ c.descripcion }}</p>
                }
                <span class="mt-5 inline-flex items-center gap-1 font-extrabold text-lila-700">
                  Ver colección
                  <span class="transition group-hover:translate-x-1" aria-hidden="true">→</span>
                </span>
              </a>
            }
          </div>
        </div>
      </section>
    }
  `,
})
export class CategoriesComponent {
  readonly categorias = signal<Categoria[]>([]);

  readonly estilos = ['bg-rosa-100', 'bg-menta-100', 'bg-durazno-100', 'bg-lila-100'];

  constructor() {
    inject(CategoriaService)
      .listar()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: lista => this.categorias.set(lista), error: () => {} });
  }
}