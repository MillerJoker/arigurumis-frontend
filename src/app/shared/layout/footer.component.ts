import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NEGOCIO, redesActivas, whatsappLink } from '../../core/config/negocio';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="bg-lila-900 text-lila-100">
      <div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p class="font-display text-3xl font-bold text-white">{{ negocio.nombre }}</p>
          <p class="mt-1 text-rosa-300">{{ negocio.eslogan }}</p>
          <p class="mt-4 max-w-xs text-sm text-lila-200">
            Peluches, llaveros y flores tejidos a mano, con cariño y a tu medida.
          </p>
        </div>

        <div>
          <p class="font-bold text-white">Explora</p>
          <ul class="mt-3 space-y-2 text-sm">
            <li><a routerLink="/catalogo" class="hover:text-rosa-300">Productos</a></li>
            <li><a routerLink="/" fragment="historia" class="hover:text-rosa-300">Nuestra historia</a></li>
            <li><a routerLink="/" fragment="como-pedir" class="hover:text-rosa-300">Cómo pedir</a></li>
            <li><a routerLink="/" fragment="contacto" class="hover:text-rosa-300">Contacto y envíos</a></li>
          </ul>
        </div>

        <div>
          <p class="font-bold text-white">Hablemos</p>
          <ul class="mt-3 space-y-2 text-sm">
            <li>{{ negocio.ciudad }}</li>
            <li>
              <a [href]="whatsapp" target="_blank" rel="noopener noreferrer"
                 class="hover:text-rosa-300">Escríbenos por WhatsApp</a>
            </li>
            @for (r of redes; track r.nombre) {
              <li>
                <a [href]="r.url" target="_blank" rel="noopener noreferrer"
                   class="hover:text-rosa-300">{{ r.nombre }}</a>
              </li>
            }
          </ul>
        </div>
      </div>

      <div class="border-t border-lila-800">
        <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-lila-300 sm:flex-row">
          <p>© {{ anio }} {{ negocio.nombre }}. Hecho a mano en {{ negocio.ciudad }}.</p>
          <a routerLink="/admin" class="hover:text-white">Acceso administración</a>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly negocio = NEGOCIO;
  readonly redes = redesActivas;
  readonly whatsapp = whatsappLink();
  readonly anio = new Date().getFullYear();
}