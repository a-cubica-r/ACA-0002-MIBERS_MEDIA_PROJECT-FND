import { apiFetch } from "./client";
import type { Paginated } from "./types";

export type TipoAlerta =
  | "PUBLICACION_FALLIDA"
  | "PUBLICACION_BLOQUEADA"
  | "PUBLICACION_ATRASADA"
  | "CUENTA_EXPIRADA"
  | "CUENTA_DESVINCULADA"
  | "ENVIO_CLIENTE_FALLIDO";

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  tipo_label: string;
  mensaje: string;
  entity_type: string;
  entity_id: string;
  leida_at: string | null;
  created_at: string;
}

export interface AlertaFilters {
  leida?: boolean;
  page?: number;
}

export function listAlertas({ leida, page }: AlertaFilters = {}): Promise<Paginated<Alerta>> {
  const query = new URLSearchParams();
  if (leida !== undefined) query.set("leida", String(leida));
  if (page !== undefined) query.set("page", String(page));
  return apiFetch(`alertas${query.size ? `?${query}` : ""}`);
}

export function marcarAlertaLeida(id: string): Promise<Alerta> {
  return apiFetch(`alertas/${encodeURIComponent(id)}/leer`, { method: "POST" });
}
