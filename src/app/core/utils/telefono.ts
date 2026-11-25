/**
 * Devuelve el número en formato internacional para wa.me, o null si no se puede deducir.
 * Asume Ecuador para móviles escritos como 09XXXXXXXX o 9XXXXXXXX.
 */
export function telefonoWhatsapp(telefono: string): string | null {
  const d = telefono.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('09')) return '593' + d.slice(1);
  if (d.length === 9 && d.startsWith('9')) return '593' + d;
  if (d.length === 12 && d.startsWith('593')) return d;
  return d.length >= 11 ? d : null;          // otro país, ya con prefijo
}