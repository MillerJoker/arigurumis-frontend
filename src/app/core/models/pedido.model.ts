export type EstadoPedido =
  | 'PENDIENTE_WHATSAPP' | 'CONFIRMADO' | 'EN_PRODUCCION'
  | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

export interface ItemPedidoRequest {
  productoId: number;
  cantidad: number;
  detallesPersonalizacion?: string;
}

export interface PedidoCreate {
  nombreCliente: string;
  telefonoCliente: string;
  direccionEnvio?: string;
  items: ItemPedidoRequest[];
}

export interface DetallePedido {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  detallesPersonalizacion: string | null;
}

export interface Pedido {
  id: number;
  usuarioId: number | null;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEnvio: string | null;
  total: number;
  estado: EstadoPedido;
  fechaCreacion: string;
  detalles?: DetallePedido[];
  whatsappUrl?: string;        // solo al crear el pedido
}