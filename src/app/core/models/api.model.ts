export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface ApiError {
  status: number;
  mensaje: string;
  errores?: string[];
}