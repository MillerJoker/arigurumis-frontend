import { Component, inject, input, model, output, signal } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { copiarAlPortapapeles } from '../../core/utils/portapapeles';
import { generarPassword } from '../../core/utils/password';

@Component({
  selector: 'app-password-field',
  template: `
    <label [attr.for]="id()" class="mb-1 block text-sm font-bold text-lila-800">{{ label() }}</label>

    <div class="flex gap-2">
      <input [id]="id()" [type]="visible() ? 'text' : 'password'" class="input min-w-0 flex-1"
             [class]="error() ? 'border-rosa-400!' : ''" maxlength="72" spellcheck="false"
             autocapitalize="off" [attr.autocomplete]="autocomplete()" [attr.aria-invalid]="!!error()"
             [attr.aria-describedby]="error() ? id() + '-error' : null"
             [value]="valor()" (input)="valor.set($any($event.target).value)" (blur)="tocado.emit()">
      <button type="button" class="btn-outline shrink-0 px-4! text-sm!" (click)="visible.update(v => !v)"
              [attr.aria-pressed]="visible()">
        {{ visible() ? 'Ocultar' : 'Mostrar' }}
      </button>
    </div>

    @if (conGenerador()) {
      <div class="mt-2 flex flex-wrap gap-2">
        <button type="button" class="btn-secondary px-4! py-2! text-sm!" (click)="generar()">
          Generar contraseña
        </button>
        <button type="button" class="btn-outline px-4! py-2! text-sm!" [disabled]="!valor()" (click)="copiar()">
          Copiar
        </button>
      </div>
    }

    @if (error(); as e) {
      <p [id]="id() + '-error'" class="mt-1 text-sm font-bold text-rosa-600">{{ e }}</p>
    } @else if (ayuda(); as a) {
      <p class="mt-1 text-sm text-lila-800/70">{{ a }}</p>
    }
  `,
})
export class PasswordFieldComponent {
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  readonly label = input('Contraseña');
  readonly autocomplete = input('new-password');
  readonly conGenerador = input(false);
  readonly error = input<string | null>(null);
  readonly ayuda = input<string | null>(null);

  /** Enlace bidireccional: [(valor)]="miSignal" */
  readonly valor = model('');
  readonly tocado = output<void>();

  readonly visible = signal(false);

  generar(): void {
    this.valor.set(generarPassword());
    this.visible.set(true);          // se muestra para poder copiarla
    this.tocado.emit();
  }

  async copiar(): Promise<void> {
    const ok = await copiarAlPortapapeles(this.valor());
    this.toast.mostrar(
      ok ? 'Contraseña copiada' : 'No se pudo copiar. Selecciónala y cópiala a mano.',
      ok ? 'ok' : 'error');
  }
}