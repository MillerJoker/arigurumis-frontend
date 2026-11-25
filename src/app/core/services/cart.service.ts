import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ApiError } from '../models/api.model';
import { ItemCarrito } from '../models/carrito.model';
import { Producto } from '../models/catalogo.model';
import { ProductoService } from './producto.service';

const STORAGE_KEY = 'arigurumis.carrito';

export const MAX_LINEAS = 30;
export const MAX_CANTIDAD = 99;
export const MAX_DETALLES = 1000;

export type ResultadoCarrito = { ok: true } | { ok: false; mensaje: string };

function nuevoId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

function esItemValido(x: unknown): x is ItemCarrito {
  if (typeof x !== 'object' || x === null) return false;
  const i = x as Record<string, unknown>;
  return typeof i['id'] === 'string'
    && typeof i['productoId'] === 'number'
    && typeof i['nombre'] === 'string'
    && typeof i['precio'] === 'number'
    && typeof i['cantidad'] === 'number' && i['cantidad'] >= 1
    && typeof i['personalizable'] === 'boolean';
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly productos = inject(ProductoService);

  private readonly _items = signal<ItemCarrito[]>(this.cargar());

  readonly items = this._items.asReadonly();
  readonly vacio = computed(() => this._items().length === 0);
  readonly cantidadTotal = computed(() => this._items().reduce((s, i) => s + i.cantidad, 0));
  readonly total = computed(() => redondear(this._items().reduce((s, i) => s + i.precio * i.cantidad, 0)));
  /** Hay productos a medida sin notas: no se puede continuar con el pedido. */
  readonly detallesIncompletos = computed(() =>
    this._items().some(i => i.personalizable && !(i.detallesPersonalizacion ?? '').trim()));

  // ---------- Operaciones ----------

  agregar(p: Producto, cantidad: number, detalles?: string | null): ResultadoCarrito {
    if (!p.disponible) {
      return { ok: false, mensaje: 'Este producto no está disponible por ahora.' };
    }
    const cant = Math.floor(cantidad);
    if (!Number.isFinite(cant) || cant < 1) {
      return { ok: false, mensaje: 'Indica una cantidad válida.' };
    }
    const notas = p.personalizable ? (detalles ?? '').trim() : '';
    if (p.personalizable && !notas) {
      return { ok: false, mensaje: 'Cuéntanos cómo lo quieres: colores, tamaño, nombre bordado…' };
    }
    if (notas.length > MAX_DETALLES) {
      return { ok: false, mensaje: `Las notas no pueden superar ${MAX_DETALLES} caracteres.` };
    }

    const stockMax = p.personalizable ? null : p.stock;
    const limite = this.limite(p.personalizable, stockMax);
    const items = this._items();

    const existente = items.find(i =>
      i.productoId === p.id && (i.detallesPersonalizacion ?? '').trim() === notas);

    if (existente) {
      const nueva = existente.cantidad + cant;
      if (nueva > limite) {
        return { ok: false, mensaje: `Ya tienes ${existente.cantidad} en tu carrito y el máximo disponible es ${limite}.` };
      }
      this.guardar(items.map(i => (i === existente ? { ...i, cantidad: nueva } : i)));
      return { ok: true };
    }

    if (cant > limite) {
      return { ok: false, mensaje: `Solo hay ${limite} disponible(s).` };
    }
    if (items.length >= MAX_LINEAS) {
      return { ok: false, mensaje: `El carrito admite hasta ${MAX_LINEAS} productos distintos.` };
    }

    this.guardar([...items, {
      id: nuevoId(),
      productoId: p.id,
      nombre: p.nombre,
      categoriaNombre: p.categoriaNombre,
      precio: p.precio,
      imagenUrl: p.imagenUrl,
      cantidad: cant,
      personalizable: p.personalizable,
      stockMax,
      detallesPersonalizacion: p.personalizable ? notas : null,
    }]);
    return { ok: true };
  }

  cambiarCantidad(id: string, cantidad: number): void {
    this.guardar(this._items().map(i => {
      if (i.id !== id) return i;
      const nueva = Math.min(Math.max(Math.floor(cantidad) || 1, 1), this.maximoDe(i));
      return { ...i, cantidad: nueva };
    }));
  }

  /** Guarda el texto tal cual mientras se escribe; se recorta al enviar el pedido. */
  cambiarDetalles(id: string, texto: string): void {
    this.guardar(this._items().map(i =>
      i.id === id ? { ...i, detallesPersonalizacion: texto.slice(0, MAX_DETALLES) } : i));
  }

  quitar(id: string): void {
    this.guardar(this._items().filter(i => i.id !== id));
  }

  vaciar(): void {
    this.guardar([]);
  }

  maximoDe(i: ItemCarrito): number {
    return this.limite(i.personalizable, i.stockMax);
  }

  // ---------- Sincronización con la API ----------

  /** Revisa precios y disponibilidad. Devuelve los avisos que se deben mostrar al cliente. */
  sincronizar(): Observable<string[]> {
    const ids = [...new Set(this._items().map(i => i.productoId))];
    if (ids.length === 0) return of([]);

    return forkJoin(ids.map(id =>
      this.productos.obtener(id).pipe(
        // null = ya no existe o está inactivo; undefined = error de red (no tocamos nada)
        catchError((e: ApiError) => of(e.status === 404 ? null : undefined)),
      ),
    )).pipe(map(resultados => this.aplicar(ids, resultados)));
  }

  private aplicar(ids: number[], resultados: (Producto | null | undefined)[]): string[] {
    const porId = new Map<number, Producto | null | undefined>(ids.map((id, n) => [id, resultados[n]]));
    const avisos: string[] = [];
    const nuevos: ItemCarrito[] = [];

    for (const item of this._items()) {
      const p = porId.get(item.productoId);

      if (p === undefined) { nuevos.push(item); continue; }
      if (p === null || !p.disponible) {
        avisos.push(`«${item.nombre}» ya no está disponible y lo quitamos del carrito.`);
        continue;
      }

      const actualizado: ItemCarrito = {
        ...item,
        nombre: p.nombre,
        categoriaNombre: p.categoriaNombre,
        imagenUrl: p.imagenUrl,
        precio: p.precio,
        personalizable: p.personalizable,
        stockMax: p.personalizable ? null : p.stock,
      };
      if (p.precio !== item.precio) {
        avisos.push(`El precio de «${p.nombre}» cambió de $${item.precio.toFixed(2)} a $${p.precio.toFixed(2)}.`);
      }
      const limite = this.maximoDe(actualizado);
      if (actualizado.cantidad > limite) {
        actualizado.cantidad = limite;
        avisos.push(`Ajustamos «${p.nombre}» a ${limite} unidad(es) por disponibilidad.`);
      }
      nuevos.push(actualizado);
    }

    this.guardar(nuevos);
    return avisos;
  }

  // ---------- Internos ----------

  private limite(personalizable: boolean, stockMax: number | null): number {
    if (personalizable || stockMax === null) return MAX_CANTIDAD;
    return Math.max(0, Math.min(stockMax, MAX_CANTIDAD));
  }

  private guardar(items: ItemCarrito[]): void {
    this._items.set(items);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  }

  private cargar(): ItemCarrito[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data: unknown = JSON.parse(raw);
      return Array.isArray(data) ? data.filter(esItemValido).slice(0, MAX_LINEAS) : [];
    } catch {
      return [];
    }
  }
}