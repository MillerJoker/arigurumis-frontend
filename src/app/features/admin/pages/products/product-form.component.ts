import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiError } from '../../../../core/models/api.model';
import { Categoria, Producto, ProductoForm } from '../../../../core/models/catalogo.model';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ImageUploaderComponent } from '../../components/image-uploader.component';

type Campo = 'nombre' | 'descripcion' | 'precio' | 'stock' | 'categoria';
type Carga = { p: Producto | null; e: ApiError | null };

/** Acepta "3.5" o "3,50". Máximo 8 enteros y 2 decimales, como el backend. */
function leerPrecio(v: string): number | null {
  const t = v.trim().replace(',', '.');
  return /^\d{1,8}(\.\d{1,2})?$/.test(t) ? Number(t) : null;
}

@Component({
  selector: 'app-product-form',
  imports: [RouterLink, ImageUploaderComponent],
  template: `
    <a routerLink="/admin/productos" class="inline-flex items-center gap-1 font-bold text-lila-600 hover:text-lila-800">
      <span aria-hidden="true">←</span> Volver a productos
    </a>

    @if (cargando()) {
      <div class="mt-6 space-y-4" aria-busy="true">
        <div class="h-12 w-1/2 animate-pulse rounded-2xl bg-lila-100"></div>
        <div class="h-64 animate-pulse rounded-3xl bg-lila-100"></div>
      </div>
    } @else if (noEncontrado() || errorCarga()) {
      <div class="card mx-auto mt-10 max-w-xl text-center">
        <h1 class="text-2xl font-bold text-lila-700">
          {{ noEncontrado() ? 'No encontramos este producto' : 'No pudimos cargar el producto' }}
        </h1>
        @if (errorCarga()) { <p class="mt-2 text-lila-800/80">{{ errorCarga() }}</p> }
        <a routerLink="/admin/productos" class="btn-primary mt-6">Ver productos</a>
      </div>
    } @else {
      <h1 class="mt-4 text-3xl font-bold text-lila-800">
        {{ esEdicion() ? 'Editar producto' : 'Nuevo producto' }}
      </h1>

      <form class="mt-6 grid items-start gap-6 lg:grid-cols-3" novalidate (submit)="guardar($event)">
        <div class="space-y-5 lg:col-span-2">
          <div class="card space-y-5">
            <div>
              <label for="p-nombre" class="mb-1 block text-sm font-bold text-lila-800">Nombre</label>
              <input id="p-nombre" type="text" class="input" maxlength="150" placeholder="Ej.: Llavero Osito"
                     [class]="errorNombre() ? 'border-rosa-400!' : ''" [attr.aria-invalid]="!!errorNombre()"
                     [value]="nombre()" (input)="nombre.set($any($event.target).value)" (blur)="tocar('nombre')">
              @if (errorNombre(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
            </div>

            <div>
              <label for="p-desc" class="mb-1 block text-sm font-bold text-lila-800">
                Descripción <span class="font-semibold text-lila-500">(opcional)</span>
              </label>
              <textarea id="p-desc" rows="4" class="input" maxlength="3000"
                        placeholder="Materiales, medidas, cuidados…"
                        [class]="errorDescripcion() ? 'border-rosa-400!' : ''"
                        [value]="descripcion()" (input)="descripcion.set($any($event.target).value)"
                        (blur)="tocar('descripcion')"></textarea>
              @if (errorDescripcion(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
            </div>

            <div>
              <label for="p-cat" class="mb-1 block text-sm font-bold text-lila-800">Categoría</label>
              <select id="p-cat" class="input" [class]="errorCategoria() ? 'border-rosa-400!' : ''"
                      [attr.aria-invalid]="!!errorCategoria()"
                      (change)="elegirCategoria($any($event.target).value)" (blur)="tocar('categoria')">
                <option value="" [selected]="categoriaId() === null">Elige una categoría…</option>
                @for (c of categorias(); track c.id) {
                  <option [value]="c.id" [selected]="categoriaId() === c.id">{{ c.nombre }}</option>
                }
              </select>
              @if (errorCategoria(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
              @if (!categorias().length) {
                <p class="mt-1 text-sm text-lila-800/75">
                  Aún no hay categorías.
                  <a routerLink="/admin/categorias" class="font-bold text-lila-600 underline">Crea la primera</a>.
                </p>
              }
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="p-precio" class="mb-1 block text-sm font-bold text-lila-800">Precio (USD)</label>
                <input id="p-precio" type="text" inputmode="decimal" class="input" placeholder="Ej.: 3.50"
                       [class]="errorPrecio() ? 'border-rosa-400!' : ''" [attr.aria-invalid]="!!errorPrecio()"
                       [value]="precio()" (input)="precio.set($any($event.target).value)" (blur)="tocar('precio')">
                @if (errorPrecio(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
              </div>

              @if (!personalizable()) {
                <div>
                  <label for="p-stock" class="mb-1 block text-sm font-bold text-lila-800">Stock (unidades)</label>
                  <input id="p-stock" type="number" min="0" step="1" inputmode="numeric" class="input"
                         [class]="errorStock() ? 'border-rosa-400!' : ''" [attr.aria-invalid]="!!errorStock()"
                         [value]="stock()" (input)="stock.set($any($event.target).value)" (blur)="tocar('stock')">
                  @if (errorStock(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p id="lbl-medida" class="font-extrabold text-lila-800">Producto a medida</p>
                <p class="mt-1 text-sm text-lila-800/75">
                  Se teje por encargo: no lleva stock y el cliente debe indicar los detalles
                  (colores, tamaño, nombre bordado) al pedirlo.
                </p>
              </div>
              <button type="button" role="switch" aria-labelledby="lbl-medida"
                      [attr.aria-checked]="personalizable()"
                      (click)="personalizable.update(v => !v)"
                      class="relative h-8 w-14 shrink-0 rounded-full transition focus-visible:outline-2
                             focus-visible:outline-offset-2 focus-visible:outline-lila-500"
                      [class]="personalizable() ? 'bg-lila-600' : 'bg-lila-200'">
                <span class="absolute top-1 left-1 size-6 rounded-full bg-white shadow transition"
                      [class.translate-x-6]="personalizable()"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="card">
            <h2 class="mb-4 text-lg font-bold text-lila-700">Foto</h2>
            <app-image-uploader [imagenUrl]="imagenUrl()" (cambio)="imagenUrl.set($event)" />
          </div>

          @if (errorServidor(); as e) {
            <div class="rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-semibold text-rosa-600" role="alert">
              <p class="font-extrabold">{{ e.mensaje }}</p>
              @if (e.errores?.length) {
                <ul class="mt-1 list-disc pl-5">
                  @for (x of e.errores; track x) { <li>{{ x }}</li> }
                </ul>
              }
            </div>
          }

          <div class="flex flex-col gap-2">
            <button type="submit" class="btn-primary w-full" [disabled]="guardando()">
              {{ guardando() ? 'Guardando…' : esEdicion() ? 'Guardar cambios' : 'Crear producto' }}
            </button>
            <a routerLink="/admin/productos" class="btn-outline w-full">Cancelar</a>
          </div>
          @if (esEdicion()) {
            <p class="text-sm text-lila-800/70">
              Para ocultar o mostrar este producto en el catálogo usa el botón «Activar» o «Desactivar» del listado.
            </p>
          }
        </div>
      </form>
    }
  `,
})
export class ProductFormComponent {
  private readonly router = inject(Router);
  private readonly productos = inject(ProductoService);
  private readonly toast = inject(ToastService);

  /** Parámetro de ruta :id. En "nuevo" no existe. */
  readonly id = input<string>();
  readonly esEdicion = computed(() => this.id() !== undefined);

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(true);
  readonly noEncontrado = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly guardando = signal(false);
  readonly errorServidor = signal<ApiError | null>(null);

  readonly nombre = signal('');
  readonly descripcion = signal('');
  readonly precio = signal('');
  readonly stock = signal('0');
  readonly categoriaId = signal<number | null>(null);
  readonly personalizable = signal(false);
  readonly imagenUrl = signal<string | null>(null);

  private readonly intentado = signal(false);
  private readonly tocados = signal<Campo[]>([]);

  private readonly vNombre = computed(() => {
    const v = this.nombre().trim();
    if (!v) return 'Escribe el nombre del producto.';
    return v.length > 150 ? 'Máximo 150 caracteres.' : null;
  });
  private readonly vDescripcion = computed(() =>
    this.descripcion().length > 3000 ? 'Máximo 3000 caracteres.' : null);
  private readonly vPrecio = computed(() =>
    leerPrecio(this.precio()) === null ? 'Ingresa un precio válido, por ejemplo 3.50 (máximo 2 decimales).' : null);
  private readonly vStock = computed(() => {
    if (this.personalizable()) return null;
    return /^\d{1,9}$/.test(this.stock().trim()) ? null : 'Ingresa un número entero de 0 en adelante.';
  });
  private readonly vCategoria = computed(() =>
    this.categoriaId() === null ? 'Elige una categoría.' : null);

  readonly errorNombre = computed(() => (this.visible('nombre') ? this.vNombre() : null));
  readonly errorDescripcion = computed(() => (this.visible('descripcion') ? this.vDescripcion() : null));
  readonly errorPrecio = computed(() => (this.visible('precio') ? this.vPrecio() : null));
  readonly errorStock = computed(() => (this.visible('stock') ? this.vStock() : null));
  readonly errorCategoria = computed(() => (this.visible('categoria') ? this.vCategoria() : null));

  constructor() {
    inject(CategoriaService).listar()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: c => this.categorias.set(c), error: () => {} });

    toObservable(this.id).pipe(
      tap(() => {
        this.cargando.set(true);
        this.noEncontrado.set(false);
        this.errorCarga.set(null);
      }),
      switchMap(valor => {
        if (valor === undefined) return of<Carga>({ p: null, e: null });      // producto nuevo
        const n = Number(valor);
        if (!Number.isInteger(n) || n <= 0) {
          return of<Carga>({ p: null, e: { status: 404, mensaje: 'Producto no encontrado' } });
        }
        return this.productos.obtenerAdmin(n).pipe(
          map((p): Carga => ({ p, e: null })),
          catchError((e: ApiError) => of<Carga>({ p: null, e })),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(({ p, e }) => {
      if (p) this.rellenar(p);
      this.noEncontrado.set(e?.status === 404);
      this.errorCarga.set(e && e.status !== 404 ? e.mensaje : null);
      this.cargando.set(false);
    });
  }

  tocar(campo: Campo): void {
    this.tocados.update(t => (t.includes(campo) ? t : [...t, campo]));
  }

  elegirCategoria(valor: string): void {
    this.categoriaId.set(valor === '' ? null : Number(valor));
  }

  guardar(event: Event): void {
    event.preventDefault();
    if (this.guardando()) return;

    this.intentado.set(true);
    const invalido = this.vNombre() ? 'p-nombre'
                   : this.vCategoria() ? 'p-cat'
                   : this.vPrecio() ? 'p-precio'
                   : this.vStock() ? 'p-stock'
                   : this.vDescripcion() ? 'p-desc' : null;
    if (invalido) {
      document.getElementById(invalido)?.focus();
      return;
    }

    const form: ProductoForm = {
      nombre: this.nombre().trim(),
      descripcion: this.descripcion().trim() || undefined,
      precio: leerPrecio(this.precio())!,
      stock: this.personalizable() ? 0 : Number(this.stock()),
      imagenUrl: this.imagenUrl(),
      personalizable: this.personalizable(),
      categoriaId: this.categoriaId()!,
    };

    this.guardando.set(true);
    this.errorServidor.set(null);

    const id = this.id();
    const peticion = id === undefined
      ? this.productos.crear(form)
      : this.productos.actualizar(Number(id), form);

    peticion.subscribe({
      next: p => {
        this.toast.mostrar(id === undefined ? `«${p.nombre}» se creó` : `«${p.nombre}» se actualizó`);
        this.router.navigate(['/admin/productos']);
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.errorServidor.set(e);
      },
    });
  }

  private rellenar(p: Producto): void {
    this.nombre.set(p.nombre);
    this.descripcion.set(p.descripcion ?? '');
    this.precio.set(p.precio.toFixed(2));
    this.stock.set(String(p.stock));
    this.categoriaId.set(p.categoriaId);
    this.personalizable.set(p.personalizable);
    this.imagenUrl.set(p.imagenUrl);
  }

  private visible(campo: Campo): boolean {
    return this.intentado() || this.tocados().includes(campo);
  }
}