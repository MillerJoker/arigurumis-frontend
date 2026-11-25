import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError, Pagina } from '../../../core/models/api.model';
import { Categoria, FiltroProductos, Producto } from '../../../core/models/catalogo.model';
import { CategoriaService } from '../../../core/services/categoria.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductCardComponent } from '../../../shared/components/product-card.component';
import { CategoryFilterComponent } from '../components/category-filter.component';

type Carga = { r: Pagina<Producto> | null; e: string | null };

function entero(valor: string | undefined): number | null {
  if (valor == null || valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

@Component({
  selector: 'app-product-list',
  imports: [ProductCardComponent, CategoryFilterComponent],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <header class="text-center">
        <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Catálogo</p>
        <h1 class="section-title mt-2">Todas nuestras creaciones</h1>
      </header>

      <form class="mx-auto mt-8 flex max-w-xl gap-2" role="search" (submit)="buscar($event)">
        <label for="busqueda" class="sr-only">Buscar productos</label>
        <input id="busqueda" type="search" class="input" placeholder="Busca un llavero, una flor, un peluche…"
               [value]="busqueda()" (input)="busqueda.set($any($event.target).value)">
        <button type="submit" class="btn-primary shrink-0">Buscar</button>
      </form>

      <div class="mt-6 flex flex-col items-center gap-3">
        <app-category-filter [categorias]="categorias()" [seleccionada]="categoriaActiva()"
                             (seleccionar)="elegirCategoria($event)" />
        <button type="button" (click)="alternarMedida()" [attr.aria-pressed]="soloMedida()"
                class="rounded-full px-4 py-2 font-bold ring-1 transition"
                [class]="soloMedida() ? 'bg-durazno-200 text-lila-800 ring-durazno-300'
                                      : 'bg-white text-lila-700 ring-lila-200 hover:bg-durazno-100'">
          Solo piezas a tu medida
        </button>
      </div>

      <div class="mt-10" aria-live="polite">
        @if (cargando()) {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            @for (i of esqueleto; track i) {
              <div class="aspect-4/5 animate-pulse rounded-3xl bg-lila-100"></div>
            }
          </div>
        } @else if (error()) {
          <div class="card text-center">
            <p class="font-bold text-rosa-600">{{ error() }}</p>
            <button type="button" class="btn-outline mt-4" (click)="limpiar()">Reintentar</button>
          </div>
        } @else if (resultado(); as r) {
          <p class="mb-5 text-sm font-bold text-lila-600">
            {{ r.totalElementos }} {{ r.totalElementos === 1 ? 'producto' : 'productos' }}
          </p>

          @if (r.contenido.length) {
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              @for (p of r.contenido; track p.id) {
                <app-product-card [producto]="p" />
              }
            </div>

            @if (r.totalPaginas > 1) {
              <nav class="mt-10 flex items-center justify-center gap-4" aria-label="Paginación">
                <button type="button" class="btn-outline" [disabled]="paginaActual() === 0"
                        (click)="irAPagina(paginaActual() - 1)">Anterior</button>
                <span class="font-bold text-lila-700">Página {{ paginaActual() + 1 }} de {{ r.totalPaginas }}</span>
                <button type="button" class="btn-outline" [disabled]="paginaActual() + 1 >= r.totalPaginas"
                        (click)="irAPagina(paginaActual() + 1)">Siguiente</button>
              </nav>
            }
          } @else {
            <div class="card text-center">
              <h2 class="text-2xl font-bold text-lila-700">No encontramos productos</h2>
              <p class="mt-2 text-lila-800/80">Prueba con otra búsqueda o quita los filtros.</p>
              @if (hayFiltros()) {
                <button type="button" class="btn-primary mt-5" (click)="limpiar()">Quitar filtros</button>
              }
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class ProductListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productos = inject(ProductoService);

  // Vienen de los query params (withComponentInputBinding)
  readonly categoriaId = input<string>();
  readonly q = input<string>();
  readonly personalizable = input<string>();
  readonly pagina = input<string>();

  readonly categorias = signal<Categoria[]>([]);
  readonly resultado = signal<Pagina<Producto> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly esqueleto = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly categoriaActiva = computed(() => entero(this.categoriaId()));
  readonly soloMedida = computed(() => this.personalizable() === 'true');
  readonly paginaActual = computed(() => entero(this.pagina()) ?? 0);
  readonly hayFiltros = computed(() =>
    this.categoriaActiva() !== null || this.soloMedida() || !!this.q()?.trim());

  private readonly filtro = computed<FiltroProductos>(() => ({
    categoriaId: this.categoriaActiva() ?? undefined,
    q: this.q()?.trim() || undefined,
    personalizable: this.soloMedida() ? true : undefined,
    pagina: this.paginaActual(),
    tamanio: 12,
  }));

  constructor() {
    inject(CategoriaService).listar()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: c => this.categorias.set(c), error: () => {} });

    // Mantiene el cuadro de búsqueda sincronizado con la URL
    effect(() => this.busqueda.set(this.q() ?? ''));

    // Cada cambio de filtro cancela la consulta anterior y lanza una nueva
    toObservable(this.filtro).pipe(
      tap(() => { this.cargando.set(true); this.error.set(null); }),
      switchMap(f => this.productos.listar(f).pipe(
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

  elegirCategoria(id: number | null): void {
    this.navegar({ categoriaId: id, pagina: null });
  }

  alternarMedida(): void {
    this.navegar({ personalizable: this.soloMedida() ? null : true, pagina: null });
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.navegar({ q: this.busqueda().trim() || null, pagina: null });
  }

  irAPagina(n: number): void {
    this.navegar({ pagina: n <= 0 ? null : n });
  }

  limpiar(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  // Un valor null elimina el parámetro de la URL
  private navegar(cambios: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: cambios, queryParamsHandling: 'merge' });
  }
}