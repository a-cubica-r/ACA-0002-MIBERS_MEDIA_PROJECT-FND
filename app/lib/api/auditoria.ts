import { apiFetch } from "./client";
import type { Paginated } from "./types";

export interface RegistroAuditoria {
  id: string;
  created_at: string;
  actor: string | null;
  actor_username: string;
  action: string;
  action_label: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
}

export interface AccionAuditoria {
  value: string;
  label: string;
}

export interface AuditoriaFiltros {
  page?: number;
  actor?: string;
  action?: string;
  entityType?: string;
  desde?: string;
  hasta?: string;
}

export function listAuditoria({
  page,
  actor,
  action,
  entityType,
  desde,
  hasta,
}: AuditoriaFiltros = {}): Promise<Paginated<RegistroAuditoria>> {
  const query = new URLSearchParams({ page: String(page ?? 1), page_size: "25" });
  if (actor) query.set("actor", actor);
  if (action) query.set("action", action);
  if (entityType) query.set("entity_type", entityType);
  if (desde) query.set("desde", desde);
  if (hasta) query.set("hasta", hasta);
  return apiFetch(`auditoria?${query}`);
}

export function listAcciones(): Promise<AccionAuditoria[]> {
  return apiFetch("auditoria/acciones");
}
