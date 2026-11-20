import { apiFetch } from "./client";
import type { EstadoPieza, PiezaResumen, Red } from "./types";

export type VistaCronograma = "semana" | "mes";
export interface DiaCronograma {
  fecha: string;
  piezas: PiezaResumen[];
}
export interface Cronograma {
  vista: VistaCronograma;
  desde: string;
  hasta: string;
  dias: DiaCronograma[];
}
export interface CronogramaFilters {
  vista: VistaCronograma;
  fecha: string;
  red?: Red;
  estado?: EstadoPieza;
}
export function getCronograma(cliente: string, filters: CronogramaFilters): Promise<Cronograma> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  return apiFetch(`clientes/${encodeURIComponent(cliente)}/cronograma?${query}`);
}
