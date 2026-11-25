const MAX_BYTES = 72;       // límite de BCrypt en el backend

/** Devuelve el mensaje de error, o null si la contraseña es válida. */
export function validarPassword(p: string): string | null {
  if (!p) return 'Escribe una contraseña.';
  if (p.length < 8) return 'Debe tener al menos 8 caracteres.';
  if (new TextEncoder().encode(p).length > MAX_BYTES) {
    return 'Es demasiado larga (máximo 72 bytes). Evita emojis o muchos caracteres especiales.';
  }
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Debe incluir al menos una letra y un número.';
  return null;
}

// Número aleatorio sin sesgo: se descartan los valores que rompen el reparto uniforme
function aleatorio(max: number): number {
  const limite = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limite);
  return buf[0] % max;
}

/** Genera una contraseña legible (sin I, O, l, 0, 1) con letras y números. */
export function generarPassword(largo = 12): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const numeros = '23456789';
  const todos = letras + numeros;

  const chars = [letras[aleatorio(letras.length)], numeros[aleatorio(numeros.length)]];
  while (chars.length < largo) chars.push(todos[aleatorio(todos.length)]);

  for (let i = chars.length - 1; i > 0; i--) {          // mezcla Fisher-Yates
    const j = aleatorio(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}