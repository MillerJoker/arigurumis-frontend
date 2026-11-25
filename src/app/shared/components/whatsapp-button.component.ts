import { Component } from '@angular/core';
import { whatsappLink } from '../../core/config/negocio';

@Component({
  selector: 'app-whatsapp-button',
  template: `
    <a [href]="url" target="_blank" rel="noopener noreferrer"
       aria-label="Escríbenos por WhatsApp"
       class="fixed right-4 bottom-4 z-50 grid size-14 place-items-center rounded-full bg-menta-600 text-white
              shadow-xl shadow-menta-600/40 transition hover:scale-110 hover:bg-menta-500
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-menta-600
              sm:right-6 sm:bottom-6">
      <svg viewBox="0 0 24 24" class="size-7" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
      </svg>
    </a>
  `,
})
export class WhatsappButtonComponent {
  readonly url = whatsappLink();
}