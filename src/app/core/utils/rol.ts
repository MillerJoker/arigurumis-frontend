import { Rol } from '../models/auth.model';

export const ROLES: { valor: Rol; texto: string; badge: string; descripcion: string }[] = [
  {
    valor: 'ADMIN', texto: 'Administrador', badge: 'bg-lila-200 text-lila-900',
    descripcion: 'Acceso total: usuarios, productos, categorías y pedidos.',
  },
  {
    valor: 'VENDEDOR', texto: 'Vendedor', badge: 'bg-rosa-200 text-lila-900',
    descripcion: 'Gestiona pedidos, productos y categorías. No administra usuarios ni elimina.',
  },
  {
    valor: 'USUARIO', texto: 'Cliente', badge: 'bg-menta-200 text-lila-900',
    descripcion: 'Cuenta de cliente. No tiene acceso al panel.',
  },
];

export function infoRol(rol: Rol) {
  return ROLES.find(r => r.valor === rol) ?? ROLES[2];
}

export function esRol(valor: unknown): valor is Rol {
  return ROLES.some(r => r.valor === valor);
}