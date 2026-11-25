import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError, Pagina } from '../../../../core/models/api.model';
import { Categoria, Producto } from '../../../../core/models/catalogo.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { ToastService } from '../../../../core/services/toast.service';
import { entero } from '../../../../core/utils/entero';
import { ImagenUrlPipe } from '../../../../shared/pipes/imagen-url.pipe';

type Carga = { r: Pagina<Producto> | null; e: string | null };

@Component({
  selector: 'app-product-manage',
  imports: [RouterLink, CurrencyPipe, NgTemplateOutlet, ImagenUrlPipe],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Catálogo</p>
        <h1 class="text-3xl font-bold text-lila-800">Productos</h1>
      </div>
      <a routerLink="/admin/productos/nuevo" class="btn-primary">+ Nuevo producto</a>
    </header>

    <form class="mt-6 flex flex-col gap-3 sm:flex-row" role="search" (submit)="buscar($event)">
      <label for="adm-q" class="sr-only">Buscar productos</label>
      <input id="adm-q" type="search" class="input" placeholder="Buscar por nombre o descripción…"
             [value]="busqueda()" (input)="busqueda.set($any($event.target).value)">
      <label for="adm-cat" class="sr-only">Categoría</label>
      <select id="adm-cat" class="input sm:max-w-56" (change)="elegirCategoria($any($event.target).value)">
        <option value="" [selected]="categoriaActiva() === null">Todas las categorías</option>
        @for (c of categorias(); track c.id) {
          <option [value]="c.id" [selected]="categoriaActiva() === c.id">{{ c.nombre }}</option>
        }
      </select>
      <button type="submit" class="btn-primary shrink-0">Buscar</button>
    </form>

    <nav class="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por estado">
      @for (f of filtrosEstado; track f.texto) {
        <a routerLink="." [queryParams]="{ activo: f.valor, pagina: null }" queryParamsHandling="merge"
           class="rounded-full px-4 py-2 font-bold ring-1 transition"
           [class]="activoFiltro() === f.bool ? 'bg-lila-600 text-white ring-lila-600'
                                               : 'bg-white text-lila-700 ring-lila-200 hover:bg-lila-50'">
          {{ f.texto }}
        </a>
      }
    </nav>

    <div class="mt-6" aria-live="polite">
      @if (cargando()) {
        <div class="space-y-3" aria-busy="true">
          @for (i of esqueleto; track i) {
            <div class="h-20 animate-pulse rounded-2xl bg-lila-100"></div>
          }
        </div>
      } @else if (error()) {
        <div class="card text-center">
          <p class="font-bold text-rosa-600" role="alert">{{ error() }}</p>
          <button type="button" class="btn-primary mt-4" (click)="recarga.update(n => n + 1)">Reintentar</button>
        </div>
      } @else if (resultado(); as r) {
        <p class="mb-4 text-sm font-bold text-lila-600">
          {{ r.totalElementos }} {{ r.totalElementos === 1 ? 'producto' : 'productos' }}
        </p>

        @if (r.contenido.length) {
          <!-- Tabla: pantallas medianas y grandes -->
          <div class="hidden overflow-x-auto rounded-3xl bg-white shadow-lg shadow-lila-900/5 ring-1 ring-lila-100 md:block">
            <table class="w-full text-left">
              <caption class="sr-only">Listado de productos</caption>
              <thead class="bg-lila-50 text-sm text-lila-700">
                <tr>
                  <th scope="col" class="px-5 py-3 font-extrabold">Producto</th>
                  <th scope="col" class="px-5 py-3 text-right font-extrabold">Precio</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Stock</th>
                  <th scope="col" class="px-5 py-3 font-extrabold">Estado</th>
                  <th scope="col" class="px-5 py-3"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-lila-100">
                @for (p of r.contenido; track p.id) {
                  <tr class="hover:bg-lila-50/60" [class.opacity-60]="!p.activo">
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-3">
                        <img [src]="p.imagenUrl | imagenUrl" alt="" loading="lazy"
                             class="size-14 shrink-0 rounded-2xl bg-lila-50 object-cover">
                        <div class="min-w-0">
                          <p class="font-bold text-lila-800">{{ p.nombre }}</p>
                          <p class="text-sm text-lila-600">{{ p.categoriaNombre }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3 text-right font-extrabold text-lila-600">
                      {{ p.precio | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </td>
                    <td class="px-5 py-3">
                      @if (p.personalizable) {
                        <span class="rounded-full bg-durazno-200 px-3 py-1 text-xs font-extrabold text-lila-900">A medida</span>
                      } @else {
                        <span class="rounded-full px-3 py-1 text-xs font-extrabold text-lila-900"
                              [class]="p.stock === 0 ? 'bg-rosa-200' : p.stock <= 5 ? 'bg-durazno-200' : 'bg-menta-100'">
                          {{ p.stock }}
                        </span>
                      }
                    </td>
                    <td class="px-5 py-3">
                      <span class="rounded-full px-3 py-1 text-xs font-extrabold"
                            [class]="p.activo ? 'bg-menta-200 text-lila-900' : 'bg-tinta/10 text-tinta'">
                        {{ p.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="px-5 py-3">
                      <ng-container [ngTemplateOutlet]="acciones" [ngTemplateOutletContext]="{ $implicit: p }" />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Tarjetas: pantallas pequeñas -->
          <ul class="space-y-3 md:hidden">
            @for (p of r.contenido; track p.id) {
              <li class="card p-4" [class.opacity-70]="!p.activo">
                <div class="flex gap-3">
                  <img [src]="p.imagenUrl | imagenUrl" alt="" loading="lazy"
                       class="size-20 shrink-0 rounded-2xl bg-lila-50 object-cover">
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-lila-800">{{ p.nombre }}</p>
                    <p class="text-sm text-lila-600">{{ p.categoriaNombre }}</p>
                    <p class="mt-1 font-extrabold text-lila-600">
                      {{ p.precio | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span class="rounded-full px-3 py-1 text-xs font-extrabold"
                        [class]="p.activo ? 'bg-menta-200 text-lila-900' : 'bg-tinta/10 text-tinta'">
                    {{ p.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                  <span class="rounded-full px-3 py-1 text-xs font-extrabold text-lila-900"
                        [class]="p.personalizable ? 'bg-durazno-200'
                               : p.stock === 0 ? 'bg-rosa-200' : p.stock <= 5 ? 'bg-durazno-200' : 'bg-menta-100'">
                    {{ p.personalizable ? 'A medida' : 'Stock: ' + p.stock }}
                  </span>
                </div>
                <div class="mt-4">
                  <ng-container [ngTemplateOutlet]="acciones" [ngTemplateOutletContext]="{ $implicit: p }" />
                </div>
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
            <h2 class="text-2xl font-bold text-lila-700">No hay productos</h2>
            <p class="mt-2 text-lila-800/80">
              {{ hayFiltros() ? 'Ningún producto coincide con los filtros.' : 'Crea el primero para verlo en el catálogo.' }}
            </p>
            @if (hayFiltros()) {
              <button type="button" class="btn-outline mt-5" (click)="limpiar()">Quitar filtros</button>
            } @else {
              <a routerLink="/admin/productos/nuevo" class="btn-primary mt-5">+ Nuevo producto</a>
            }
          </div>
        }
      }
    </div>

    <!-- Acciones de cada producto (se reutilizan en la tabla y en las tarjetas) -->
    <ng-template #acciones let-p>
      <div class="flex flex-wrap items-center gap-2">
        <a [routerLink]="['/admin/productos', p.id, 'editar']" class="btn-outline px-4! py-2! text-sm!">Editar</a>
        <button type="button" class="btn-secondary px-4! py-2! text-sm!"
                [disabled]="ocupado() === p.id" (click)="alternar(p)">
          {{ p.activo ? 'Desactivar' : 'Activar' }}
        </button>
        @if (auth.esAdmin()) {
          <button type="button" (click)="eliminar(p)"
                  class="rounded-full px-3 py-2 text-sm font-bold text-rosa-600 hover:bg-rosa-100">Eliminar</button>
        }
      </div>
    </ng-template>
  `,
})
export class ProductManageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productos = inject(ProductoService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  // Vienen de los query params (withComponentInputBinding)
  readonly q = input<string>();
  readonly categoriaId = input<string>();
  readonly activo = input<string>();
  readonly pagina = input<string>();

  readonly categorias = signal<Categoria[]>([]);
  readonly resultado = signal<Pagina<Producto> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly recarga = signal(0);
  readonly ocupado = signal<number | null>(null);
  readonly esqueleto = [1, 2, 3, 4, 5];

  readonly filtrosEstado = [
    { texto: 'Todos', valor: null, bool: null },
    { texto: 'Activos', valor: 'true', bool: true },
    { texto: 'Inactivos', valor: 'false', bool: false },
  ];

  readonly categoriaActiva = computed(() => entero(this.categoriaId()));
  readonly activoFiltro = computed<boolean | null>(() =>
    this.activo() === 'true' ? true : this.activo() === 'false' ? false : null);
  readonly paginaActual = computed(() => entero(this.pagina()) ?? 0);
  readonly hayFiltros = computed(() =>
    this.categoriaActiva() !== null || this.activoFiltro() !== null || !!this.q()?.trim());

  private readonly consulta = computed(() => ({
    filtro: {
      categoriaId: this.categoriaActiva() ?? undefined,
      q: this.q()?.trim() || undefined,
      activo: this.activoFiltro() ?? undefined,
      pagina: this.paginaActual(),
      tamanio: 15,
    },
    recarga: this.recarga(),
  }));

  constructor() {
    inject(CategoriaService).listar()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: c => this.categorias.set(c), error: () => {} });

    toObservable(this.consulta).pipe(
      tap(() => { this.cargando.set(true); this.error.set(null); }),
      switchMap(c => this.productos.listarAdmin(c.filtro).pipe(
        map((r): Carga => ({ r, e: null })),
        catchError((e: ApiError) => of<Carga>({ r: null, e: e.mensaje })),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ r, e }) => {
      this.resultado.set(r);
      this.error.set(e);
      this.cargando.set(false);
    });

    // El cuadro de búsqueda sigue a la URL
    toObservable(this.q).pipe(takeUntilDestroyed()).subscribe(v => this.busqueda.set(v ?? ''));
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.navegar({ q: this.busqueda().trim() || null, pagina: null });
  }

  elegirCategoria(valor: string): void {
    this.navegar({ categoriaId: valor || null, pagina: null });
  }

  limpiar(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  alternar(p: Producto): void {
    if (this.ocupado() !== null) return;
    this.ocupado.set(p.id);
    this.productos.cambiarActivo(p.id, !p.activo).subscribe({
      next: act => {
        this.ocupado.set(null);
        this.resultado.update(r => r && {
          ...r,
          contenido: r.contenido.map(x => (x.id === act.id ? act : x)),
        });
        this.toast.mostrar(act.activo
          ? `«${act.nombre}» ya se ve en el catálogo`
          : `«${act.nombre}» se ocultó del catálogo`);
      },
      error: (e: ApiError) => {
        this.ocupado.set(null);
        this.toast.mostrar(e.mensaje, 'error');
      },
    });
  }

  eliminar(p: Producto): void {
    const aviso = `¿Eliminar «${p.nombre}» definitivamente? Se borrará también su foto y no se puede deshacer.\n\n`
                + 'Si el producto ya se vendió alguna vez, el sistema no lo permitirá: en ese caso, desactívalo.';
    if (!confirm(aviso)) return;

    this.productos.eliminar(p.id, true).subscribe({
      next: () => {
        this.toast.mostrar(`«${p.nombre}» se eliminó`);
        this.recarga.update(n => n + 1);
      },
      error: (e: ApiError) => this.toast.mostrar(e.mensaje, 'error'),
    });
  }

  // Un valor null elimina el parámetro de la URL
  private navegar(cambios: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: cambios, queryParamsHandling: 'merge' });
  }
}