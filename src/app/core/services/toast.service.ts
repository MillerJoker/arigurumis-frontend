import { Injectable, signal } from '@angular/core';

export interface Toast {
  texto: string;
  tipo: 'ok' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly mensaje = signal<Toast | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  mostrar(texto: string, tipo: Toast['tipo'] = 'ok'): void {
    clearTimeout(this.temporizador);
    this.mensaje.set({ texto, tipo });
    this.temporizador = setTimeout(() => this.mensaje.set(null), 3500);
  }

  ocultar(): void {
    clearTimeout(this.temporizador);
    this.mensaje.set(null);
  }
}