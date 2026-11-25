import { Component } from '@angular/core';

@Component({
  selector: 'app-how-to-order',
  template: `
    <section id="como-pedir" class="scroll-mt-20 bg-lila-50/60 py-16 md:py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center">
          <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Es muy fácil</p>
          <h2 class="section-title mt-2">Cómo hacer tu pedido</h2>
          <p class="mx-auto mt-3 max-w-xl text-lg text-lila-800/80">
            Sin pagos en línea ni complicaciones: armas tu pedido aquí y lo confirmamos contigo por WhatsApp.
          </p>
        </div>

        <ol class="mt-12 grid gap-6 md:grid-cols-3">
          @for (p of pasos; track p.numero) {
            <li class="card relative pt-10 text-center">
              <span class="absolute -top-6 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full
                           font-display text-2xl font-bold text-lila-800 shadow-md"
                    [class]="p.color">{{ p.numero }}</span>
              <h3 class="text-xl font-bold text-lila-700">{{ p.titulo }}</h3>
              <p class="mt-2 text-lila-800/80">{{ p.texto }}</p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
})
export class HowToOrderComponent {
  readonly pasos = [
    {
      numero: 1, color: 'bg-rosa-200',
      titulo: 'Elige tus favoritos',
      texto: 'Recorre el catálogo y agrega al carrito llaveros, flores o peluches.',
    },
    {
      numero: 2, color: 'bg-menta-200',
      titulo: 'Cuéntanos cómo lo quieres',
      texto: 'En los productos a medida, indica colores, tamaño, nombre bordado y todos los detalles.',
    },
    {
      numero: 3, color: 'bg-durazno-200',
      titulo: 'Confirma por WhatsApp',
      texto: 'Registramos tu pedido y se abre el chat con el resumen. Allí coordinamos el pago y la entrega contigo.',
    },
  ];
}