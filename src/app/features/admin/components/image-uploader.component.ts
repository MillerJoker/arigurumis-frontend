import { Component, DestroyRef, ElementRef, computed, effect, inject, input, output,
         signal, untracked, viewChild } from '@angular/core';
import { ApiError } from '../../../core/models/api.model';
import { ImagenService } from '../../../core/services/imagen.service';
import { ImagenUrlPipe } from '../../../shared/pipes/imagen-url.pipe';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL_MB = 20;      // la foto se reduce antes de subirla
const MIN_LADO = 300;            // px del lado más corto
const SALIDA_MAX = 1024;         // px del cuadrado final
const CALIDAD_JPG = 0.88;
const ZOOM_MAX = 4;

interface Editor {
  src: string;                   // URL temporal de la foto elegida
  w: number;
  h: number;
}

@Component({
  selector: 'app-image-uploader',
  imports: [ImagenUrlPipe],
  host: { '(document:keydown.escape)': 'cancelar()' },
  template: `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="aspect-square size-36 shrink-0 overflow-hidden rounded-3xl bg-lila-50 ring-1 ring-lila-100">
        <img [src]="imagenUrl() | imagenUrl" alt="Foto actual del producto" class="size-full object-cover">
      </div>

      <div>
        <div class="flex flex-wrap gap-2">
          <label class="btn-outline cursor-pointer focus-within:outline-2 focus-within:outline-offset-2
                        focus-within:outline-lila-500">
            {{ imagenUrl() ? 'Cambiar foto' : 'Subir foto' }}
            <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp"
                   (change)="elegir($event)">
          </label>
          @if (imagenUrl()) {
            <button type="button" class="btn-secondary" (click)="cambio.emit(null)">Quitar foto</button>
          }
        </div>
        <p class="mt-3 max-w-sm text-sm text-lila-800/75">
          Puedes elegir fotos horizontales o verticales: en el siguiente paso las encuadras en cuadrado,
          tal como se ven en el catálogo.
        </p>
        @if (error() && !editor()) {
          <p class="mt-3 rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-bold text-rosa-600" role="alert">
            {{ error() }}
          </p>
        }
      </div>
    </div>

    @if (editor(); as ed) {
      <div class="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true"
           aria-labelledby="recorte-titulo">
        <div class="absolute inset-0 bg-lila-900/60"></div>

        <div class="relative max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
          <h2 id="recorte-titulo" class="text-xl font-bold text-lila-700">Encuadra tu foto</h2>
          <p class="mt-1 text-sm text-lila-800/75">
            Arrastra para mover y usa el zoom. Lo que ves dentro del cuadro es lo que se publicará.
          </p>

          <div #viewport tabindex="0"
               aria-label="Área de recorte. Usa las flechas para mover la foto y más o menos para el zoom"
               class="relative mx-auto mt-4 aspect-square w-full max-w-80 cursor-grab touch-none overflow-hidden
                      rounded-3xl bg-lila-100 ring-2 ring-lila-200 outline-none select-none
                      focus-visible:ring-lila-500 active:cursor-grabbing"
               (pointerdown)="iniciarArrastre($event)" (pointermove)="mover($event)"
               (pointerup)="terminarArrastre()" (pointercancel)="terminarArrastre()"
               (wheel)="rueda($event)" (keydown)="teclado($event)">
            <img [src]="ed.src" alt="" draggable="false"
                 class="pointer-events-none absolute max-w-none select-none"
                 [style.width.px]="anchoImg()" [style.height.px]="altoImg()"
                 [style.left.px]="ox()" [style.top.px]="oy()">
          </div>

          <div class="mx-auto mt-4 flex max-w-80 items-center gap-3">
            <button type="button" (click)="cambiarZoom(zoom() - 0.25)" aria-label="Alejar"
                    class="grid size-10 shrink-0 place-items-center rounded-full bg-lila-50 text-xl font-extrabold
                           text-lila-700 hover:bg-lila-100">−</button>
            <input type="range" min="1" [max]="zoomMax" step="0.01" class="w-full accent-lila-600"
                   aria-label="Zoom" [value]="zoom()" (input)="cambiarZoom(+$any($event.target).value)">
            <button type="button" (click)="cambiarZoom(zoom() + 0.25)" aria-label="Acercar"
                    class="grid size-10 shrink-0 place-items-center rounded-full bg-lila-50 text-xl font-extrabold
                           text-lila-700 hover:bg-lila-100">+</button>
          </div>

          @if (error()) {
            <p class="mt-4 rounded-2xl bg-rosa-100 px-4 py-3 text-sm font-bold text-rosa-600" role="alert">
              {{ error() }}
            </p>
          }

          <div class="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" class="btn-outline" (click)="cancelar()" [disabled]="subiendo()">Cancelar</button>
            <button type="button" class="btn-primary" (click)="usar()" [disabled]="subiendo()">
              {{ subiendo() ? 'Subiendo…' : 'Usar esta foto' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ImageUploaderComponent {
  private readonly api = inject(ImagenService);

  /** URL guardada actualmente en el producto ("/api/imagenes/uuid.jpg"). */
  readonly imagenUrl = input<string | null>(null);
  /** Emite la nueva URL, o null si se quitó la foto. */
  readonly cambio = output<string | null>();

  readonly editor = signal<Editor | null>(null);
  readonly subiendo = signal(false);
  readonly error = signal<string | null>(null);
  readonly zoom = signal(1);
  readonly zoomMax = ZOOM_MAX;
  readonly ox = signal(0);                 // posición de la foto dentro del cuadro
  readonly oy = signal(0);
  private readonly vista = signal(0);      // lado del cuadro en píxeles CSS

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private img: HTMLImageElement | null = null;
  private urlTemporal: string | null = null;
  private arrastre: { px: number; py: number; ox: number; oy: number } | null = null;

  // La foto cubre el cuadro (como object-cover); el zoom parte de ahí
  private readonly escala = computed(() => {
    const e = this.editor();
    const v = this.vista();
    return e && v ? (v / Math.min(e.w, e.h)) * this.zoom() : 0;
  });
  readonly anchoImg = computed(() => (this.editor()?.w ?? 0) * this.escala());
  readonly altoImg = computed(() => (this.editor()?.h ?? 0) * this.escala());

  constructor() {
    // Cuando aparece el cuadro de recorte: se mide, se centra y recibe el foco
    effect(() => {
      const el = this.viewport()?.nativeElement;
      if (el && this.editor() && this.vista() === 0) {
        untracked(() => {
          this.vista.set(el.clientWidth);
          this.zoom.set(1);
          this.limitar((el.clientWidth - this.anchoImg()) / 2, (el.clientWidth - this.altoImg()) / 2);
          el.focus();
        });
      }
    });
    inject(DestroyRef).onDestroy(() => this.liberar());
  }

  // ---------- Elegir la foto ----------

  async elegir(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';                        // permite elegir el mismo archivo otra vez
    if (!archivo) return;

    this.error.set(null);
    if (!TIPOS.includes(archivo.type)) {
      this.error.set('Formato no permitido. Usa JPG, PNG o WEBP. Las fotos HEIC del iPhone deben convertirse primero.');
      return;
    }
    if (archivo.size > MAX_ORIGINAL_MB * 1024 * 1024) {
      this.error.set(`La foto pesa demasiado (máximo ${MAX_ORIGINAL_MB} MB).`);
      return;
    }

    const src = URL.createObjectURL(archivo);
    try {
      const img = await this.cargar(src);
      if (Math.min(img.naturalWidth, img.naturalHeight) < MIN_LADO) {
        URL.revokeObjectURL(src);
        this.error.set(`La foto es muy pequeña: necesita al menos ${MIN_LADO} px por lado.`);
        return;
      }
      this.liberar();
      this.img = img;
      this.urlTemporal = src;
      this.editor.set({ src, w: img.naturalWidth, h: img.naturalHeight });
    } catch {
      URL.revokeObjectURL(src);
      this.error.set('No pudimos leer esa foto. Prueba con otra.');
    }
  }

  private cargar(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('imagen no legible'));
      img.src = src;
    });
  }

  // ---------- Mover y hacer zoom ----------

  iniciarArrastre(e: PointerEvent): void {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.arrastre = { px: e.clientX, py: e.clientY, ox: this.ox(), oy: this.oy() };
  }

  mover(e: PointerEvent): void {
    const a = this.arrastre;
    if (a) this.limitar(a.ox + e.clientX - a.px, a.oy + e.clientY - a.py);
  }

  terminarArrastre(): void {
    this.arrastre = null;
  }

  rueda(e: WheelEvent): void {
    e.preventDefault();
    this.cambiarZoom(this.zoom() - Math.sign(e.deltaY) * 0.15);
  }

  teclado(e: KeyboardEvent): void {
    const paso = 12;
    const mapa: Record<string, () => void> = {
      ArrowLeft:  () => this.limitar(this.ox() - paso, this.oy()),
      ArrowRight: () => this.limitar(this.ox() + paso, this.oy()),
      ArrowUp:    () => this.limitar(this.ox(), this.oy() - paso),
      ArrowDown:  () => this.limitar(this.ox(), this.oy() + paso),
      '+':        () => this.cambiarZoom(this.zoom() + 0.25),
      '=':        () => this.cambiarZoom(this.zoom() + 0.25),
      '-':        () => this.cambiarZoom(this.zoom() - 0.25),
    };
    const accion = mapa[e.key];
    if (accion) {
      e.preventDefault();
      accion();
    }
  }

  /** El zoom se hace alrededor del centro del cuadro. */
  cambiarZoom(valor: number): void {
    const v = this.vista();
    if (!v) return;
    const antes = this.escala();
    const cx = (v / 2 - this.ox()) / antes;      // punto de la foto que está en el centro
    const cy = (v / 2 - this.oy()) / antes;
    this.zoom.set(Math.min(ZOOM_MAX, Math.max(1, valor)));
    const ahora = this.escala();
    this.limitar(v / 2 - cx * ahora, v / 2 - cy * ahora);
  }

  /** La foto nunca deja huecos dentro del cuadro. */
  private limitar(x: number, y: number): void {
    const v = this.vista();
    this.ox.set(Math.min(0, Math.max(v - this.anchoImg(), x)));
    this.oy.set(Math.min(0, Math.max(v - this.altoImg(), y)));
  }

  // ---------- Recortar y subir ----------

  async usar(): Promise<void> {
    const img = this.img;
    const s = this.escala();
    if (!img || !s || this.subiendo()) return;

    const lado = this.vista() / s;                          // lado del recorte en píxeles de la foto original
    const sx = Math.max(0, -this.ox() / s);
    const sy = Math.max(0, -this.oy() / s);
    const salida = Math.max(1, Math.min(SALIDA_MAX, Math.round(lado)));   // nunca se amplía

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = salida;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.error.set('Tu navegador no pudo preparar la foto.');
      return;
    }
    ctx.fillStyle = '#ffffff';                              // los PNG transparentes quedan sobre blanco
    ctx.fillRect(0, 0, salida, salida);
    ctx.drawImage(img, sx, sy, lado, lado, 0, 0, salida, salida);

    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', CALIDAD_JPG));
    if (!blob) {
      this.error.set('No se pudo preparar la foto. Prueba con otra.');
      return;
    }

    this.subiendo.set(true);
    this.error.set(null);
    this.api.subir(blob).subscribe({
      next: r => {
        this.subiendo.set(false);
        this.cerrar();
        this.cambio.emit(r.url);
      },
      error: (e: ApiError) => {
        this.subiendo.set(false);
        this.error.set(e.mensaje);
      },
    });
  }

  cancelar(): void {
    if (this.editor() && !this.subiendo()) this.cerrar();
  }

  private cerrar(): void {
    this.liberar();
    this.editor.set(null);
    this.vista.set(0);
    this.error.set(null);
  }

  private liberar(): void {
    if (this.urlTemporal) URL.revokeObjectURL(this.urlTemporal);
    this.urlTemporal = null;
    this.img = null;
  }
}