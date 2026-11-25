export interface ConfirmacionPedido {
  id: number;
  nombreCliente: string;
  total: number;
  whatsappUrl: string;
  abierto: boolean;          // true cuando ya se abrió WhatsApp (evita bucles)
}

const clave = (id: number) => `arigurumis.pedido.${id}`;

/** Solo se acepta un enlace oficial de WhatsApp. */
export function esUrlWhatsapp(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('https://wa.me/');
}

export function guardarConfirmacion(c: ConfirmacionPedido): boolean {
  try {
    sessionStorage.setItem(clave(c.id), JSON.stringify(c));
    return true;
  } catch {
    return false;
  }
}

export function leerConfirmacion(id: number): ConfirmacionPedido | null {
  try {
    const raw = sessionStorage.getItem(clave(id));
    if (!raw) return null;
    const c = JSON.parse(raw) as ConfirmacionPedido;
    return c.id === id && esUrlWhatsapp(c.whatsappUrl) ? c : null;
  } catch {
    return null;
  }
}

export function marcarAbierto(id: number): void {
  const c = leerConfirmacion(id);
  if (c) guardarConfirmacion({ ...c, abierto: true });
}