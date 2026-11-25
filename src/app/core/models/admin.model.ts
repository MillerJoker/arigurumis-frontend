import { EstadoPedido, Pedido } from './pedido.model';

export interface StockBajo {
  id: number;
  nombre: string;
  stock: number;
}

export interface Estadisticas {
  pedidosPorEstado: Record<EstadoPedido, number>;
  pendientesAntiguos: Pedido[];
  productosActivos: number;
  productosInactivos: number;
  umbralStock: number;
  productosStockBajo: StockBajo[];
  ingresosMes: number;
  ingresosDesde: string;
}