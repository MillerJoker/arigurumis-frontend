/** Minutos transcurridos desde una fecha ISO del servidor. */
function minutosDesde(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function diasDesde(iso: string): number {
  return Math.floor(minutosDesde(iso) / 1440);
}

export function hace(iso: string): string {
  const min = minutosDesde(iso);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
}