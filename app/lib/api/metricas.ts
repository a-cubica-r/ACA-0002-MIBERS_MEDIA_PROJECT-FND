import { apiFetch } from "./client";
import type { Paginated, Red } from "./types";

export const METRIC_FIELDS = ["alcance", "visualizaciones", "interacciones", "seguidores"] as const;
export type MetricField = (typeof METRIC_FIELDS)[number];
export type MetricValues = Record<MetricField, number | null>;
export interface Metrica extends MetricValues {
  id: string;
  cliente: string;
  cliente_nombre: string;
  red: Red;
  mes: string;
  origen: "MANUAL" | "API";
  sincronizado_at: string | null;
  registrado_por_username: string;
  updated_at: string;
}
export interface MetricaFilters {
  cliente?: string;
  red?: Red;
  desde?: string;
  hasta?: string;
  page?: number;
  page_size?: number;
}
export function listMetricas(filters: MetricaFilters = {}): Promise<Paginated<Metrica>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return apiFetch(`metricas${query.size ? `?${query}` : ""}`);
}
export async function allMetricas(filters: MetricaFilters): Promise<Metrica[]> {
  const results: Metrica[] = [];
  let page = 1;
  while (true) {
    const response = await listMetricas({ ...filters, page, page_size: 100 });
    results.push(...response.results);
    if (!response.next) return results;
    page += 1;
  }
}
export function saveMetricas(
  cliente: string,
  input: { red: Red; mes: string } & Partial<MetricValues>,
): Promise<Metrica> {
  return apiFetch(`clientes/${encodeURIComponent(cliente)}/metricas`, {
    method: "PUT",
    json: input,
  });
}
export function syncMetricas(cliente: string, mes: string): Promise<Metrica[]> {
  return apiFetch(`clientes/${encodeURIComponent(cliente)}/metricas/sincronizar`, {
    method: "POST",
    json: { mes },
  });
}
