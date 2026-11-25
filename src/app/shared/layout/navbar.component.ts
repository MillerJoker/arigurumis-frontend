import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { whatsappLink } from '../../core/config/negocio';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-40 border-b border-lila-100 bg-white/90 backdrop-blur">
      <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
           aria-label="Principal">
        <a routerLink="/" (click)="cerrar()" aria-label="Arigurumis, ir al inicio">
          <img src="images/logo.png" alt="Arigurumis, entre lanas y sueños" class="h-11 w-auto sm:h-12">
        </a>

        <ul class="hidden items-center gap-1 md:flex">
          @for (e of enlaces; track e.texto) {
            <li>
              <a [routerLink]="e.ruta" [fragment]="e.fragmento"
                 class="rounded-full px-4 py-2 font-bold text-lila-800 transition hover:bg-lila-50 hover:text-lila-600">
                {{ e.texto }}
              </a>
            </li>
          }
        </ul>

        <div class="flex items-center gap-2">
          <a routerLink="/catalogo/carrito" (click)="cerrar()"
             [attr.aria-label]="'Ver carrito, ' + carrito.cantidadTotal() + ' artículo(s)'"
             class="relative grid size-11 place-items-center rounded-full text-lila-700 transition hover:bg-lila-50">
            <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>
            </svg>
            @if (carrito.cantidadTotal() > 0) {
              <span class="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full
                           bg-rosa-500 px-1 text-xs font-extrabold text-white">
                {{ carrito.cantidadTotal() }}
              </span>
            }
          </a>
          <a [href]="whatsapp" target="_blank" rel="noopener noreferrer"
             class="btn-primary hidden sm:inline-flex">Pedir por WhatsApp</a>

          <button type="button"
                  class="grid size-11 place-items-center rounded-full text-lila-700 hover:bg-lila-50 md:hidden"
                  (click)="alternar()" [attr.aria-expanded]="abierto()"
                  aria-controls="menu-movil" aria-label="Abrir o cerrar el menú">
            <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" aria-hidden="true">
              @if (abierto()) {
                <path d="M6 6l12 12M18 6L6 18"/>
              } @else {
                <path d="M4 7h16M4 12h16M4 17h16"/>
              }
            </svg>
          </button>
        </div>
      </nav>

      @if (abierto()) {
        <div id="menu-movil" class="border-t border-lila-100 bg-white px-4 pb-5 pt-3 md:hidden">
          <ul class="space-y-1">
            @for (e of enlaces; track e.texto) {
              <li>
                <a [routerLink]="e.ruta" [fragment]="e.fragmento" (click)="cerrar()"
                   class="block rounded-2xl px-4 py-3 font-bold text-lila-800 hover:bg-lila-50">
                  {{ e.texto }}
                </a>
              </li>
            }
          </ul>
          <a [href]="whatsapp" target="_blank" rel="noopener noreferrer"
             class="btn-primary mt-3 w-full">Pedir por WhatsApp</a>
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  readonly abierto = signal(false);
  readonly whatsapp = whatsappLink('Hola Arigurumis, quisiera hacer un pedido.');
  readonly carrito = inject(CartService);

  readonly enlaces = [
    { texto: 'Inicio',     ruta: '/',         fragmento: undefined },
    { texto: 'Historia',   ruta: '/',         fragmento: 'historia' },
    { texto: 'Productos',  ruta: '/catalogo', fragmento: undefined },
    { texto: 'Cómo pedir', ruta: '/',         fragmento: 'como-pedir' },
    { texto: 'Contacto',   ruta: '/',         fragmento: 'contacto' },
  ];

  alternar(): void { this.abierto.update(v => !v); }
  cerrar(): void { this.abierto.set(false); }
}