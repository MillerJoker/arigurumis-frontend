import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/models/api.model';
import { PedidoCreate } from '../../../core/models/pedido.model';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { esUrlWhatsapp, guardarConfirmacion } from '../../../core/utils/confirmacion';
import { ImagenUrlPipe } from '../../../shared/pipes/imagen-url.pipe';

type Campo = 'nombre' | 'telefono' | 'direccion';

// Mismo patrón que valida el backend (PedidoCreateDTO)
const PATRON_TELEFONO = /^[0-9+()\-\s]{7,20}$/;

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, CurrencyPipe, ImagenUrlPipe],
  template: `
    <section class="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <a routerLink="/catalogo/carrito" class="inline-flex items-center gap-1 font-bold text-lila-600 hover:text-lila-800">
        <span aria-hidden="true">←</span> Volver al carrito
      </a>

      <h1 class="section-title mt-4 text-center">Finalizar pedido</h1>
      <p class="mx-auto mt-2 max-w-xl text-center text-lg text-lila-800/80">
        Déjanos tus datos y confirmamos todo contigo por WhatsApp. No se realiza ningún pago en línea.
      </p>

      @if (avisos().length) {
        <div class="mx-auto mt-6 max-w-3xl space-y-2 rounded-3xl bg-durazno-100 p-5 ring-1 ring-durazno-200" role="status">
          @for (a of avisos(); track a) {
            <p class="font-semibold text-lila-800">{{ a }}</p>
          }
        </div>
      }

      <div class="mt-10 grid items-start gap-8 lg:grid-cols-5">
        <form class="card space-y-5 lg:col-span-3" novalidate (submit)="enviar($event)">
          <h2 class="text-xl font-bold text-lila-700">Tus datos</h2>

          <div>
            <label for="co-nombre" class="mb-1 block text-sm font-bold text-lila-800">Nombre completo</label>
            <input id="co-nombre" type="text" class="input" autocomplete="name" maxlength="120"
                   placeholder="Ej.: Ana Pérez"
                   [class]="errorNombre() ? 'border-rosa-400!' : ''"
                   [attr.aria-invalid]="!!errorNombre()"
                   [attr.aria-describedby]="errorNombre() ? 'err-nombre' : null"
                   [value]="nombre()" (input)="nombre.set($any($event.target).value)"
                   (blur)="tocar('nombre')">
            @if (errorNombre(); as e) {
              <p id="err-nombre" class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p>
            }
          </div>

          <div>
            <label for="co-telefono" class="mb-1 block text-sm font-bold text-lila-800">
              Teléfono o WhatsApp
            </label>
            <input id="co-telefono" type="tel" inputmode="tel" class="input" autocomplete="tel" maxlength="20"
                   placeholder="Ej.: 0991234567"
                   [class]="errorTelefono() ? 'border-rosa-400!' : ''"
                   [attr.aria-invalid]="!!errorTelefono()"
                   [attr.aria-describedby]="errorTelefono() ? 'err-telefono' : null"
                   [value]="telefono()" (input)="telefono.set($any($event.target).value)"
                   (blur)="tocar('telefono')">
            @if (errorTelefono(); as e) {
              <p id="err-telefono" class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p>
            }
          </div>

          <div>
            <label for="co-direccion" class="mb-1 block text-sm font-bold text-lila-800">
              Dirección o ciudad de entrega <span class="font-semibold text-lila-500">(opcional)</span>
            </label>
            <textarea id="co-direccion" rows="3" class="input" autocomplete="street-address" maxlength="300"
                      placeholder="Ciudad, barrio y referencia. Si prefieres, la coordinamos por WhatsApp."
                      [class]="errorDireccion() ? 'border-rosa-400!' : ''"
                      [attr.aria-invalid]="!!errorDireccion()"
                      [attr.aria-describedby]="errorDireccion() ? 'err-direccion' : null"
                      [value]="direccion()" (input)="direccion.set($any($event.target).value)"
                      (blur)="tocar('direccion')"></textarea>
            @if (errorDireccion(); as e) {
              <p id="err-direccion" class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p>
            }
            <p class="mt-1 text-sm text-lila-800/70">
              Entregamos en puntos de Quito y enviamos a todo el Ecuador con Servientrega.
            </p>
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

          <button type="submit" class="btn-primary w-full" [disabled]="enviando() || sincronizando()">
            {{ enviando() ? 'Registrando tu pedido…' : 'Confirmar y abrir WhatsApp' }}
          </button>
          <p class="text-center text-sm text-lila-800/70">
            Usaremos tus datos únicamente para gestionar tu pedido.
          </p>
        </form>

        <aside class="card lg:sticky lg:top-24 lg:col-span-2">
          <h2 class="text-xl font-bold text-lila-700">Tu pedido</h2>

          <ul class="mt-4 divide-y divide-lila-100">
            @for (item of carrito.items(); track item.id) {
              <li class="flex gap-3 py-3">
                <img [src]="item.imagenUrl | imagenUrl" [alt]="item.nombre"
                     class="size-16 shrink-0 rounded-2xl bg-lila-50 object-cover">
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-lila-800">{{ item.nombre }}</p>
                  <p class="text-sm text-lila-600">
                    {{ item.cantidad }} × {{ item.precio | currency: 'USD' : 'symbol' : '1.2-2' }}
                  </p>
                  @if (item.detallesPersonalizacion) {
                    <p class="mt-1 rounded-xl bg-durazno-50 px-3 py-2 text-sm text-lila-800">
                      <span class="font-extrabold">A medida:</span> {{ item.detallesPersonalizacion }}
                    </p>
                  }
                </div>
                <p class="font-extrabold text-lila-700">
                  {{ item.precio * item.cantidad | currency: 'USD' : 'symbol' : '1.2-2' }}
                </p>
              </li>
            }
          </ul>

          <div class="mt-3 flex justify-between border-t border-lila-100 pt-4 text-xl">
            <span class="font-bold text-lila-800">Total</span>
            <span class="font-extrabold text-lila-600">
              {{ carrito.total() | currency: 'USD' : 'symbol' : '1.2-2' }}
            </span>
          </div>
          <p class="mt-3 text-sm text-lila-800/70">
            No incluye el envío: te confirmamos el costo y la forma de pago por WhatsApp.
          </p>
        </aside>
      </div>
    </section>
  `,
})
export class CheckoutComponent {
  private readonly router = inject(Router);
  private readonly pedidos = inject(PedidoService);
  private readonly auth = inject(AuthService);
  readonly carrito = inject(CartService);

  readonly nombre = signal(this.auth.usuario()?.nombre ?? '');
  readonly telefono = signal('');
  readonly direccion = signal('');

  readonly avisos = signal<string[]>([]);
  readonly sincronizando = signal(true);
  readonly enviando = signal(false);
  readonly errorServidor = signal<ApiError | null>(null);

  private readonly intentado = signal(false);
  private readonly tocados = signal<Campo[]>([]);

  // Validaciones (solo se muestran tras tocar el campo o intentar enviar)
  private readonly vNombre = computed(() => {
    const v = this.nombre().trim();
    if (!v) return 'Escribe tu nombre.';
    return v.length > 120 ? 'Máximo 120 caracteres.' : null;
  });

  private readonly vTelefono = computed(() => {
    const v = this.telefono().trim();
    if (!v) return 'Escribe un número para poder contactarte.';
    if (!PATRON_TELEFONO.test(v) || v.replace(/\D/g, '').length < 7) {
      return 'Ingresa un teléfono válido, por ejemplo 0991234567.';
    }
    return null;
  });

  private readonly vDireccion = computed(() =>
    this.direccion().length > 300 ? 'Máximo 300 caracteres.' : null);

  readonly errorNombre = computed(() => (this.visible('nombre') ? this.vNombre() : null));
  readonly errorTelefono = computed(() => (this.visible('telefono') ? this.vTelefono() : null));
  readonly errorDireccion = computed(() => (this.visible('direccion') ? this.vDireccion() : null));

  constructor() {
    // Al entrar se revisan precios y disponibilidad por si algo cambió
    this.carrito.sincronizar().pipe(takeUntilDestroyed()).subscribe({
      next: avisos => {
        this.avisos.set(avisos);
        this.sincronizando.set(false);
        if (this.carrito.vacio()) this.router.navigate(['/catalogo/carrito']);
      },
      error: () => this.sincronizando.set(false),
    });
  }

  tocar(campo: Campo): void {
    this.tocados.update(t => (t.includes(campo) ? t : [...t, campo]));
  }

  enviar(event: Event): void {
    event.preventDefault();
    if (this.enviando() || this.sincronizando()) return;

    this.intentado.set(true);
    const invalido = this.vNombre() ? 'co-nombre'
                   : this.vTelefono() ? 'co-telefono'
                   : this.vDireccion() ? 'co-direccion' : null;
    if (invalido) {
      document.getElementById(invalido)?.focus();
      return;
    }

    const pedido: PedidoCreate = {
      nombreCliente: this.nombre().trim(),
      telefonoCliente: this.telefono().trim(),
      direccionEnvio: this.direccion().trim() || undefined,
      items: this.carrito.items().map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        detallesPersonalizacion: i.personalizable ? (i.detallesPersonalizacion ?? '').trim() : undefined,
      })),
    };

    this.enviando.set(true);
    this.errorServidor.set(null);

    this.pedidos.crear(pedido).subscribe({
      next: p => {
        // Si no se puede guardar, la confirmación ofrece un enlace genérico con el número de pedido
        if (esUrlWhatsapp(p.whatsappUrl)) {
          guardarConfirmacion({
            id: p.id,
            nombreCliente: p.nombreCliente,
            total: p.total,
            whatsappUrl: p.whatsappUrl,
            abierto: false,
          });
        }
        // El carrito se vacía una vez en la confirmación, para no mostrar el resumen vacío
        this.router.navigate(['/catalogo/pedido-confirmado', p.id])
          .then(() => this.carrito.vaciar());
      },
      error: (e: ApiError) => {
        this.enviando.set(false);
        this.errorServidor.set(e);
        // Stock agotado o producto desactivado: refrescamos el carrito con los datos reales
        if (e.status === 400 || e.status === 409) {
          this.carrito.sincronizar().subscribe(avisos => {
            this.avisos.set(avisos);
            if (this.carrito.vacio()) this.router.navigate(['/catalogo/carrito']);
          });
        }
      },
    });
  }

  private visible(campo: Campo): boolean {
    return this.intentado() || this.tocados().includes(campo);
  }
}