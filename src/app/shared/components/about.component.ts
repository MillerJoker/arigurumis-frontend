import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  template: `
    <section id="historia" class="scroll-mt-20 bg-white py-16 md:py-24">
      <div class="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p class="font-extrabold tracking-wide text-rosa-600 uppercase">Nuestra historia</p>
          <h2 class="section-title mt-2">Un peluche, un abrazo y una niña llamada Arianna</h2>

          <div class="mt-6 space-y-4 text-lg leading-relaxed text-lila-800/85">
            <p>
              Todo comenzó en agosto de 2024, con una motivación muy personal: Juli Almeida, fundadora
              de Arigurumis, tejió a mano un peluche como objeto de apego para su hija Arianna. Lo que
              nació como un gesto de cariño y compañía en casa reveló el poder emocional de una pieza
              artesanal hecha con dedicación, paciencia y cuidado en cada puntada.
            </p>
            <p>
              De esa experiencia surgió el nombre: «Arigurumi» une «Arianna» con «gurumi», de
              amigurumi, el arte japonés de tejer figuras y muñecos a mano. Hoy trabajamos desde casa,
              en Quito, y combinamos la calidez del tejido tradicional con herramientas modernas como
              esta web, las redes sociales y la atención directa por WhatsApp Business para llegar a
              todo el Ecuador.
            </p>
            <p>
              Cada llavero, cada peluche de línea o de temporada y cada creación personalizada
              conserva esa esencia: transformar el afecto, los recuerdos y la creatividad en figuras
              únicas que acompañan, reconfortan y cuentan historias.
            </p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card bg-lila-50 text-center ring-lila-100">
            <p class="text-sm font-extrabold tracking-wide text-lila-600 uppercase">¿De dónde viene el nombre?</p>
            <div class="mt-5 flex flex-wrap items-center justify-center gap-3 font-display text-2xl font-bold">
              <span class="rounded-2xl bg-rosa-100 px-4 py-2 text-lila-800">Arianna</span>
              <span class="text-lila-400">+</span>
              <span class="rounded-2xl bg-menta-100 px-4 py-2 text-lila-800">gurumi</span>
              <span class="text-lila-400">=</span>
              <span class="rounded-2xl bg-lila-600 px-4 py-2 text-white">Arigurumi</span>
            </div>
          </div>

          <ul class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            @for (d of datos; track d.titulo) {
              <li class="rounded-3xl p-5 text-center" [class]="d.fondo">
                <p class="font-display text-xl font-bold text-lila-800">{{ d.titulo }}</p>
                <p class="mt-1 text-sm font-semibold text-lila-700">{{ d.texto }}</p>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  readonly datos = [
    { titulo: 'Desde 2024', texto: 'Nacimos en agosto', fondo: 'bg-durazno-100' },
    { titulo: 'Quito', texto: 'Hecho a mano en casa', fondo: 'bg-rosa-100' },
    { titulo: 'Ecuador', texto: 'Envíos a todo el país', fondo: 'bg-menta-100' },
  ];
}