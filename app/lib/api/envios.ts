import { apiFetch } from "./client";
import type { Envio, EstadoEnvio, Paginated } from "./types";

export const ENVIOS_PAGE_SIZE = 25;
export interface EnvioFiltros {
  cliente?: string;
  pieza?: string;
  estado?: EstadoEnvio | "";
  desde?: string;
  hasta?: string;
  page?: number;
}

/** Registro de envíos al cliente (HU-19, RF18). */
export function listEnvios({ page = 1, ...filtros }: EnvioFiltros = {}): Promise<Paginated<Envio>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filtros)) if (value) query.set(key, value);
  query.set("page", String(page));
  query.set("page_size", String(ENVIOS_PAGE_SIZE));
  return apiFetch(`envios?${query}`);
}

export function listEnviosPieza(piezaId: string): Promise<Envio[]> {
  return apiFetch(`piezas/${encodeURIComponent(piezaId)}/envios`);
}
