import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { whatsappLink } from '../../core/config/negocio';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  template: `
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-rosa-200/60 blur-3xl"></div>
      <div class="pointer-events-none absolute top-1/2 -left-32 size-96 rounded-full bg-menta-200/60 blur-3xl"></div>

      <div class="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:py-20">
        <div class="text-center md:text-left">
          <p class="inline-block rounded-full bg-durazno-100 px-4 py-1.5 text-sm font-extrabold text-lila-700">
            Tejido a mano en Quito
          </p>
          <h1 class="mt-5 text-4xl leading-tight font-bold text-lila-800 sm:text-5xl lg:text-6xl">
            Tejemos <span class="text-rosa-600">cariño</span> en cada puntada
          </h1>
          <p class="mx-auto mt-5 max-w-lg text-lg text-lila-800/80 md:mx-0">
            Llaveros, flores que no se marchitan y peluches personalizados a tu gusto.
            Piezas únicas para acompañar, reconfortar y contar historias.
          </p>

          <div class="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <a routerLink="/catalogo" class="btn-primary">Ver productos</a>
            <a [href]="medida" target="_blank" rel="noopener noreferrer" class="btn-outline">
              Quiero uno a mi medida
            </a>
          </div>

          <ul class="mt-8 flex flex-wrap justify-center gap-2 text-sm font-bold md:justify-start">
            <li class="rounded-full bg-lila-100 px-4 py-1.5 text-lila-700">Hecho a mano</li>
            <li class="rounded-full bg-rosa-100 px-4 py-1.5 text-lila-700">Personalizable</li>
            <li class="rounded-full bg-menta-100 px-4 py-1.5 text-lila-700">Envíos a todo el Ecuador</li>
          </ul>
        </div>

        <!-- Ilustración con los elementos del logo -->
        <div class="relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
          <div class="absolute inset-6 rounded-full bg-lila-100"></div>
          <svg viewBox="0 0 400 400" class="relative h-full w-full motion-safe:animate-float">
            <path d="M120 330c-40 10-70 40-40 60s70-10 110-30" class="stroke-lila-400" fill="none"
                  stroke-width="16" stroke-linecap="round"/>
            <circle cx="210" cy="215" r="125" class="fill-lila-500"/>
            <path d="M100 190c50 20 110 40 190 20M118 290c60-20 120-60 150-150" class="stroke-lila-300"
                  fill="none" stroke-width="16" stroke-linecap="round"/>
            <g class="stroke-rosa-300" stroke-width="14" stroke-linecap="round">
              <line x1="170" y1="100" x2="150" y2="30"/>
              <line x1="245" y1="100" x2="285" y2="35"/>
            </g>
            <circle cx="148" cy="26" r="14" class="fill-rosa-300"/>
            <circle cx="288" cy="30" r="14" class="fill-rosa-300"/>
          </svg>

          @for (c of corazones; track $index) {
            <svg viewBox="0 0 24 24" [class]="c" class="absolute">
              <path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.4 12 21 12 21z"/>
            </svg>
          }
        </div>
      </div>
    </section>
  `,
})
export class HeroComponent {
  readonly medida = whatsappLink('Hola Arigurumis, quiero cotizar un amigurumi a mi medida.');

  readonly corazones = [
    'top-4 left-4 size-14 fill-menta-300 motion-safe:animate-float',
    'top-16 right-2 size-10 fill-rosa-300 motion-safe:animate-float',
    'bottom-16 left-0 size-9 fill-lila-300 motion-safe:animate-float',
    'right-8 bottom-8 size-12 fill-menta-300 motion-safe:animate-float',
    'top-1/2 right-0 size-7 fill-durazno-300 motion-safe:animate-float',
  ];
}