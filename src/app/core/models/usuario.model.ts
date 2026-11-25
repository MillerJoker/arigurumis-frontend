import { Rol } from './auth.model';

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: Rol;
  activo: boolean;
}

export interface UsuarioCrear {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
  rol: Rol;
}

export interface UsuarioEditar {
  nombre: string;
  correo: string;
  telefono?: string;
  rol: Rol;
}

export interface FiltroUsuarios {
  q?: string;
  rol?: Rol;
  activo?: boolean;
  pagina?: number;
  tamanio?: number;
}