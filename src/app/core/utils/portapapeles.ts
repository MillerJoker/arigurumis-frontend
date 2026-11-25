/** Copia un texto al portapapeles. Devuelve false si el navegador no lo permite. */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}