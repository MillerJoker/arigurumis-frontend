import { environment } from '../../../environments/environment';

export const NEGOCIO = {
  nombre: 'Arigurumis',
  eslogan: 'entre lanas y sueños',
  ciudad: 'Quito, Ecuador',
  redes: [
    { nombre: 'Instagram', url: '' },   // ej.: 'https://instagram.com/tu_cuenta'
    { nombre: 'TikTok', url: '' },
    { nombre: 'Facebook', url: '' },
  ],
};

export const redesActivas = NEGOCIO.redes.filter(r => r.url.trim() !== '');

export function whatsappLink(mensaje = 'Hola Arigurumis, quisiera más información.'): string {
  return `https://wa.me/${environment.whatsappNumero}?text=${encodeURIComponent(mensaje)}`;
}