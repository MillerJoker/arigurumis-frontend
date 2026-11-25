import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError } from '../../../../core/models/api.model';
import { Categoria } from '../../../../core/models/catalogo.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-category-manage',
  template: `
    <header>
      <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Catálogo</p>
      <h1 class="text-3xl font-bold text-lila-800">Categorías</h1>
    </header>

    <div class="mt-6 grid items-start gap-6 lg:grid-cols-5">
      <form id="form-categoria" class="card space-y-4 lg:sticky lg:top-24 lg:col-span-2" novalidate
            (submit)="guardar($event)">
        <h2 class="text-xl font-bold text-lila-700">
          {{ editandoId() ? 'Editar categoría' : 'Nueva categoría' }}
        </h2>

        <div>
          <label for="cat-nombre" class="mb-1 block text-sm font-bold text-lila-800">Nombre</label>
          <input id="cat-nombre" type="text" class="input" maxlength="80" placeholder="Ej.: Llaveros"
                 [class]="errorNombre() ? 'border-rosa-400!' : ''" [attr.aria-invalid]="!!errorNombre()"
                 [value]="nombre()" (input)="nombre.set($any($event.target).value)">
          @if (errorNombre(); as e) { <p class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p> }
        </div>

        <div>
          <label for="cat-desc" class="mb-1 block text-sm font-bold text-lila-800">
            Descripción <span class="font-semibold text-lila-500">(opcional)</span>
          </label>
          <textarea id="cat-desc" rows="3" class="input" maxlength="2000"
                    placeholder="Se muestra en la página de inicio"
                    [value]="descripcion()" (input)="descripcion.set($any($event.target).value)"></textarea>
        </div>

        @if (errorForm(); as e) {
          <div class="rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-semibold text-rosa-600" role="alert">
            <p class="font-extrabold">{{ e.mensaje }}</p>
            @if (e.errores?.length) {
              <ul class="mt-1 list-disc pl-5">
                @for (x of e.errores; track x) { <li>{{ x }}</li> }
              </ul>
            }
          </div>
        }

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn-primary flex-1" [disabled]="guardando()">
            {{ guardando() ? 'Guardando…' : editandoId() ? 'Guardar cambios' : 'Crear categoría' }}
          </button>
          @if (editandoId()) {
            <button type="button" class="btn-outline" (click)="cancelar()" [disabled]="guardando()">Cancelar</button>
          }
        </div>
      </form>

      <section class="lg:col-span-3" aria-live="polite">
        @if (cargando()) {
          <div class="space-y-3" aria-busy="true">
            @for (i of esqueleto; track i) {
              <div class="h-20 animate-pulse rounded-2xl bg-lila-100"></div>
            }
          </div>
        } @else if (error()) {
          <div class="card text-center">
            <p class="font-bold text-rosa-600" role="alert">{{ error() }}</p>
            <button type="button" class="btn-primary mt-4" (click)="cargar()">Reintentar</button>
          </div>
        } @else if (lista().length) {
          <ul class="space-y-3">
            @for (c of lista(); track c.id) {
              <li class="card flex flex-wrap items-center justify-between gap-3 p-5"
                  [class.ring-2]="editandoId() === c.id" [class.ring-lila-400]="editandoId() === c.id">
                <div class="min-w-0 flex-1">
                  <p class="text-lg font-bold text-lila-800">{{ c.nombre }}</p>
                  @if (c.descripcion) {
                    <p class="mt-0.5 text-sm text-lila-800/75">{{ c.descripcion }}</p>
                  }
                </div>
                <div class="flex gap-2">
                  <button type="button" class="btn-outline px-4! py-2! text-sm!" (click)="editar(c)">Editar</button>
                  @if (auth.esAdmin()) {
                    <button type="button" (click)="eliminar(c)"
                            class="rounded-full px-3 py-2 text-sm font-bold text-rosa-600 hover:bg-rosa-100">Eliminar</button>
                  }
                </div>
              </li>
            }
          </ul>
        } @else {
          <div class="card text-center">
            <h2 class="text-2xl font-bold text-lila-700">Aún no hay categorías</h2>
            <p class="mt-2 text-lila-800/80">Crea la primera con el formulario para poder añadir productos.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class CategoryManageComponent {
  private readonly api = inject(CategoriaService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly lista = signal<Categoria[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly esqueleto = [1, 2, 3];

  readonly nombre = signal('');
  readonly descripcion = signal('');
  readonly editandoId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly errorForm = signal<ApiError | null>(null);
  private readonly intentado = signal(false);

  private readonly vNombre = computed(() => {
    const v = this.nombre().trim();
    if (!v) return 'Escribe el nombre de la categoría.';
    return v.length > 80 ? 'Máximo 80 caracteres.' : null;
  });
  readonly errorNombre = computed(() => (this.intentado() ? this.vNombre() : null));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.listar().pipe(takeUntilDestroyed()).subscribe({
      next: l => { this.lista.set(l); this.cargando.set(false); },
      error: (e: ApiError) => { this.error.set(e.mensaje); this.cargando.set(false); },
    });
  }

  editar(c: Categoria): void {
    this.editandoId.set(c.id);
    this.nombre.set(c.nombre);
    this.descripcion.set(c.descripcion ?? '');
    this.errorForm.set(null);
    this.intentado.set(false);
    const form = document.getElementById('form-categoria');
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('cat-nombre')?.focus({ preventScroll: true });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.nombre.set('');
    this.descripcion.set('');
    this.errorForm.set(null);
    this.intentado.set(false);
  }

  guardar(event: Event): void {
    event.preventDefault();
    if (this.guardando()) return;

    this.intentado.set(true);
    if (this.vNombre()) {
      document.getElementById('cat-nombre')?.focus();
      return;
    }

    const form = { nombre: this.nombre().trim(), descripcion: this.descripcion().trim() || null };
    const id = this.editandoId();

    this.guardando.set(true);
    this.errorForm.set(null);

    const peticion = id === null ? this.api.crear(form) : this.api.actualizar(id, form);
    peticion.subscribe({
      next: c => {
        this.guardando.set(false);
        this.lista.update(l => {
          const resto = l.filter(x => x.id !== c.id);
          return [...resto, c].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        });
        this.toast.mostrar(id === null ? `Categoría «${c.nombre}» creada` : `Categoría «${c.nombre}» actualizada`);
        this.cancelar();
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.errorForm.set(e);
      },
    });
  }

  eliminar(c: Categoria): void {
    if (!confirm(`¿Eliminar la categoría «${c.nombre}»?\n\nSolo se puede si no tiene productos asociados.`)) return;

    this.api.eliminar(c.id).subscribe({
      next: () => {
        this.lista.update(l => l.filter(x => x.id !== c.id));
        if (this.editandoId() === c.id) this.cancelar();
        this.toast.mostrar(`Categoría «${c.nombre}» eliminada`);
      },
      error: (e: ApiError) => this.toast.mostrar(e.mensaje, 'error'),
    });
  }
}