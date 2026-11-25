import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-quantity-stepper',
  template: `
    <div class="inline-flex items-center rounded-full bg-lila-50 ring-1 ring-lila-100" role="group"
         aria-label="Cantidad">
      <button type="button" (click)="cambio.emit(valor() - 1)" [disabled]="valor() <= min()"
              aria-label="Disminuir cantidad"
              class="grid size-11 place-items-center rounded-full text-xl font-extrabold text-lila-700
                     hover:bg-lila-100 disabled:opacity-40 disabled:hover:bg-transparent">−</button>
      <span class="min-w-10 text-center text-lg font-extrabold text-lila-800" aria-live="polite">{{ valor() }}</span>
      <button type="button" (click)="cambio.emit(valor() + 1)" [disabled]="valor() >= max()"
              aria-label="Aumentar cantidad"
              class="grid size-11 place-items-center rounded-full text-xl font-extrabold text-lila-700
                     hover:bg-lila-100 disabled:opacity-40 disabled:hover:bg-transparent">+</button>
    </div>
  `,
})
export class QuantityStepperComponent {
  readonly valor = input.required<number>();
  readonly min = input(1);
  readonly max = input(99);
  readonly cambio = output<number>();
}