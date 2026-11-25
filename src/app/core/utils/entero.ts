/** Convierte un query param a entero >= 0, o null si no es válido. */
export function entero(valor: string | undefined): number | null {
  if (valor == null || valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 ? n : null;
}