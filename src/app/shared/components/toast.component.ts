import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="pointer-events-none fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm" role="status" aria-live="polite">
      @if (toast.mensaje(); as m) {
        <div class="pointer-events-auto flex items-start gap-3 rounded-2xl px-5 py-4 font-bold shadow-xl"
             [class]="m.tipo === 'ok' ? 'bg-lila-800 text-white' : 'bg-rosa-100 text-rosa-600'">
          <span class="flex-1">{{ m.texto }}</span>
          <button type="button" (click)="toast.ocultar()" aria-label="Cerrar aviso"
                  class="text-lg leading-none opacity-70 hover:opacity-100">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}