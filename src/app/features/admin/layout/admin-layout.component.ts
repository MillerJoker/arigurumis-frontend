import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../shared/components/toast.component';

interface EnlacePanel {
  texto: string;
  ruta: string;
  icono: string;            // atributo "d" de un <path> SVG
  soloAdmin?: boolean;
}

const ENLACES: EnlacePanel[] = [
  { texto: 'Resumen', ruta: '/admin/dashboard', icono: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  { texto: 'Pedidos', ruta: '/admin/pedidos', icono: 'M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0' },
  { texto: 'Productos', ruta: '/admin/productos', icono: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8' },
  { texto: 'Categorías', ruta: '/admin/categorias', icono: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z' },
  {
    texto: 'Usuarios', ruta: '/admin/usuarios', soloAdmin: true,
    icono: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    texto: 'Mi perfil', ruta: '/admin/perfil',
    icono: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
];

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgTemplateOutlet, ToastComponent],
  host: { '(document:keydown.escape)': 'cerrar()' },
  template: `
    <div class="min-h-screen bg-lila-50/50">
      <!-- Barra lateral: escritorio -->
      <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-lila-100 bg-white lg:flex">
        <ng-container [ngTemplateOutlet]="menu" />
      </aside>

      <!-- Barra superior: móvil y tablet -->
      <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-lila-100
                     bg-white/90 px-3 backdrop-blur lg:hidden">
        <button type="button" (click)="abierto.set(true)" aria-label="Abrir menú"
                [attr.aria-expanded]="abierto()"
                class="grid size-11 place-items-center rounded-full text-lila-700 hover:bg-lila-50">
          <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <img src="images/logo.png" alt="Arigurumis" class="h-10 w-auto">
        <span class="size-11" aria-hidden="true"></span>
      </header>

      <!-- Menú desplegable: móvil y tablet -->
      @if (abierto()) {
        <div class="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel">
          <button type="button" class="absolute inset-0 bg-lila-900/50" (click)="cerrar()"
                  aria-label="Cerrar menú"></button>
          <aside class="relative flex h-full w-72 max-w-[85%] flex-col bg-white shadow-2xl">
            <button type="button" (click)="cerrar()" aria-label="Cerrar menú"
                    class="absolute top-3 right-3 grid size-10 place-items-center rounded-full text-lila-600 hover:bg-lila-50">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.4"
                   stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <ng-container [ngTemplateOutlet]="menu" />
          </aside>
        </div>
      }

      <div class="lg:pl-64">
        <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-toast />

    <!-- Contenido del menú (se reutiliza en escritorio y móvil) -->
    <ng-template #menu>
      <div class="flex h-16 shrink-0 items-center border-b border-lila-100 px-5">
        <a routerLink="/admin/dashboard" (click)="cerrar()" aria-label="Ir al resumen">
          <img src="images/logo.png" alt="Arigurumis, entre lanas y sueños" class="h-10 w-auto">
        </a>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Panel de administración">
        @for (e of enlaces(); track e.ruta) {
          <a [routerLink]="e.ruta" routerLinkActive="bg-lila-100 text-lila-800" ariaCurrentWhenActive="page"
             (click)="cerrar()"
             class="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-lila-700 transition hover:bg-lila-50">
            <svg viewBox="0 0 24 24" class="size-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path [attr.d]="e.icono"/>
            </svg>
            {{ e.texto }}
          </a>
        }
      </nav>

      <div class="shrink-0 border-t border-lila-100 p-4">
        <p class="truncate font-bold text-lila-800">{{ auth.usuario()?.nombre }}</p>
        <p class="mt-1 inline-block rounded-full bg-menta-100 px-3 py-0.5 text-xs font-extrabold text-lila-800">
          {{ auth.usuario()?.rol }}
        </p>
        <div class="mt-3 flex gap-2">
          <a routerLink="/" class="btn-outline flex-1 px-3! py-2! text-sm!">Ver sitio</a>
          <button type="button" (click)="auth.logout()" class="btn-secondary flex-1 px-3! py-2! text-sm!">Salir</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  readonly abierto = signal(false);

  readonly enlaces = computed(() =>
    ENLACES.filter(e => !e.soloAdmin || this.auth.esAdmin()));

  cerrar(): void {
    this.abierto.set(false);
  }
}