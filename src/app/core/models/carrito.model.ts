export interface ItemCarrito {
  id: string;                              // identificador de la línea
  productoId: number;
  nombre: string;
  categoriaNombre: string;
  precio: number;                          // solo informativo; el servidor recalcula
  imagenUrl: string | null;
  cantidad: number;
  personalizable: boolean;
  stockMax: number | null;                 // null = sin límite (a medida)
  detallesPersonalizacion: string | null;
}