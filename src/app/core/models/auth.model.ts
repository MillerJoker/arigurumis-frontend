export type Rol = 'ADMIN' | 'VENDEDOR' | 'USUARIO';

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEnSegundos: number;
  usuarioId: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}