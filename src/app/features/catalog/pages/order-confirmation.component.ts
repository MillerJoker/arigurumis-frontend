import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { whatsappLink } from '../../../core/config/negocio';
import { leerConfirmacion, marcarAbierto } from '../../../core/utils/confirmacion';

@Component({
  selector: 'app-order-confirmation',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <section class="mx-auto max-w-2xl px-6 py-12 md:py-16">
      <div class="card text-center">
        <div class="mx-auto grid size-20 place-items-center rounded-full bg-menta-100" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="size-10 text-menta-600" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <h1 class="mt-5 text-3xl font-bold text-lila-700">
          {{ datos() ? '¡Gracias, ' + primerNombre() + '!' : '¡Pedido registrado!' }}
        </h1>

        @if (idValido) {
          <p class="mt-3 inline-block rounded-full bg-lila-100 px-4 py-1.5 font-extrabold text-lila-700">
            Pedido #{{ id }}
          </p>
        }
        @if (datos(); as d) {
          <p class="mt-3 text-lg text-lila-800/85">
            Total del pedido:
            <strong class="text-lila-600">{{ d.total | currency: 'USD' : 'symbol' : '1.2-2' }}</strong>
            <span class="block text-sm text-lila-800/70">(sin envío)</span>
          </p>
        }

        <div class="mt-6 rounded-3xl bg-durazno-50 p-5 text-left ring-1 ring-durazno-200">
          <p class="font-extrabold text-lila-800">Un último paso</p>
          <p class="mt-1 text-lila-800/85">
            Tu pedido queda <strong>pendiente</strong> hasta que nos envíes el mensaje por WhatsApp.
            Ahí confirmamos disponibilidad, costo de envío y forma de pago.
          </p>
        </div>

        <a [href]="urlWhatsapp()" target="_blank" rel="noopener noreferrer" (click)="alAbrir()"
           class="btn-primary mt-6 w-full sm:w-auto">
          {{ datos()?.abierto ? 'Abrir WhatsApp de nuevo' : 'Abrir WhatsApp' }}
        </a>

        @if (redirigiendo()) {
          <p class="mt-3 text-sm font-semibold text-lila-600" role="status">
            Te llevaremos a WhatsApp en unos segundos. Si no se abre, pulsa el botón.
          </p>
        }
        @if (!datos()) {
          <p class="mt-3 text-sm text-lila-800/70">
            Escríbenos indicando tu número de pedido y lo confirmamos contigo.
          </p>
        }

        <div class="mt-8 border-t border-lila-100 pt-6">
          <a routerLink="/catalogo" class="btn-outline">Seguir explorando</a>
        </div>
      </div>
    </section>
  `,
})
export class OrderConfirmationComponent {
  private readonly destroyRef = inject(DestroyRef);
  private temporizador?: ReturnType<typeof setTimeout>;

  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly idValido = Number.isInteger(this.id) && this.id > 0;

  readonly datos = signal(this.idValido ? leerConfirmacion(this.id) : null);
  readonly redirigiendo = signal(false);

  readonly primerNombre = computed(() => this.datos()?.nombreCliente.trim().split(/\s+/)[0] ?? '');

  // Sin datos guardados, enlace genérico que ya incluye el número de pedido
  readonly urlWhatsapp = computed(() =>
    this.datos()?.whatsappUrl
      ?? whatsappLink(this.idValido
          ? `Hola Arigurumis, acabo de registrar el pedido #${this.id}. ¿Me ayudas a confirmarlo?`
          : 'Hola Arigurumis, acabo de registrar un pedido.'));

  constructor() {
    const d = this.datos();
    // Solo se abre automáticamente la primera vez; al volver atrás no se repite
    if (d && !d.abierto) {
      this.redirigiendo.set(true);
      this.temporizador = setTimeout(() => {
        marcarAbierto(d.id);
        window.location.assign(d.whatsappUrl);
      }, 3000);
    }
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizador));
  }

  /** El cliente pulsó el botón: cancelamos la apertura automática para no duplicarla. */
  alAbrir(): void {
    clearTimeout(this.temporizador);
    this.redirigiendo.set(false);
    if (this.idValido) marcarAbierto(this.id);
  }
}