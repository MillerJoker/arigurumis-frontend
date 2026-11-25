import { EstadoPedido } from '../models/pedido.model';

export const ESTADOS: EstadoPedido[] = [
  'PENDIENTE_WHATSAPP', 'CONFIRMADO', 'EN_PRODUCCION', 'ENVIADO', 'ENTREGADO', 'CANCELADO',
];

/** Recorrido normal de un pedido (CANCELADO queda fuera). */
export const FLUJO: EstadoPedido[] = [
  'PENDIENTE_WHATSAPP', 'CONFIRMADO', 'EN_PRODUCCION', 'ENVIADO', 'ENTREGADO',
];

export const ESTADO_INFO: Record<EstadoPedido, { texto: string; badge: string; accion: string }> = {
  PENDIENTE_WHATSAPP: { texto: 'Pendiente', badge: 'bg-durazno-200 text-lila-900', accion: 'Volver a pendiente' },
  CONFIRMADO:         { texto: 'Confirmado', badge: 'bg-lila-200 text-lila-900', accion: 'Confirmar pedido' },
  EN_PRODUCCION:      { texto: 'En producción', badge: 'bg-rosa-200 text-lila-900', accion: 'Pasar a producción' },
  ENVIADO:            { texto: 'Enviado', badge: 'bg-menta-200 text-lila-900', accion: 'Marcar como enviado' },
  ENTREGADO:          { texto: 'Entregado', badge: 'bg-menta-300 text-lila-900', accion: 'Marcar como entregado' },
  CANCELADO:          { texto: 'Cancelado', badge: 'bg-tinta/10 text-tinta', accion: 'Cancelar pedido' },
};

export function esEstado(valor: unknown): valor is EstadoPedido {
  return typeof valor === 'string' && (ESTADOS as string[]).includes(valor);
}

export function esFinal(estado: EstadoPedido): boolean {
  return estado === 'ENTREGADO' || estado === 'CANCELADO';
}