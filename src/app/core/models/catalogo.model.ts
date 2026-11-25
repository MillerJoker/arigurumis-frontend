export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  personalizable: boolean;
  activo: boolean;
  disponible: boolean;
  categoriaId: number;
  categoriaNombre: string;
}

export interface ProductoForm {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
  personalizable: boolean;
  categoriaId: number;
}

export interface FiltroProductos {
  categoriaId?: number;
  q?: string;
  personalizable?: boolean;
  activo?: boolean;
  pagina?: number;
  tamanio?: number;
}