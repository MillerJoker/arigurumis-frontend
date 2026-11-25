import { Component } from '@angular/core';
import { NEGOCIO, redesActivas, whatsappLink } from '../../core/config/negocio';

@Component({
  selector: 'app-contact',
  template: `
    <section id="contacto" class="scroll-mt-20 bg-white py-16 md:py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center">
          <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Entregas y contacto</p>
          <h2 class="section-title mt-2">Llegamos hasta ti</h2>
        </div>

        <div class="mt-10 grid gap-6 md:grid-cols-3">
          @for (i of items; track i.titulo) {
            <div class="rounded-3xl p-7" [class]="i.fondo">
              <h3 class="text-xl font-bold text-lila-800">{{ i.titulo }}</h3>
              <p class="mt-2 text-lila-800/85">{{ i.texto }}</p>
            </div>
          }
        </div>

        <div class="mt-12 rounded-4xl bg-lila-600 px-6 py-12 text-center text-white">
          <h3 class="text-3xl font-bold">¿Tienes una idea en mente?</h3>
          <p class="mx-auto mt-2 max-w-lg text-lila-100">
            Cuéntanos qué personaje, colores y tamaño imaginas y lo tejemos para ti.
          </p>
          <a [href]="whatsapp" target="_blank" rel="noopener noreferrer"
             class="btn mt-6 bg-white text-lila-700 hover:bg-rosa-100">Escríbenos por WhatsApp</a>

          @if (redes.length) {
            <ul class="mt-6 flex flex-wrap justify-center gap-3 text-sm font-bold">
              @for (r of redes; track r.nombre) {
                <li>
                  <a [href]="r.url" target="_blank" rel="noopener noreferrer"
                     class="rounded-full bg-lila-700 px-4 py-2 hover:bg-lila-800">{{ r.nombre }}</a>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </section>
  `,
})
export class ContactComponent {
  readonly redes = redesActivas;
  readonly whatsapp = whatsappLink('Hola Arigurumis, tengo una idea para un amigurumi personalizado.');

  readonly items = [
    {
      titulo: 'Entregas en Quito',
      texto: 'Coordinamos la entrega en puntos estratégicos de la ciudad.',
      fondo: 'bg-rosa-100',
    },
    {
      titulo: 'Envíos a todo el Ecuador',
      texto: 'Enviamos a nivel nacional a través de Servientrega.',
      fondo: 'bg-menta-100',
    },
    {
      titulo: 'Atención directa',
      texto: 'Te atendemos personalmente por WhatsApp Business desde ' + NEGOCIO.ciudad + '.',
      fondo: 'bg-durazno-100',
    },
  ];
}