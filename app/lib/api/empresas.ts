import { apiFetch } from "./client";
import type { EmpresaActual } from "./types";
export function listEmpresasActuales(): Promise<EmpresaActual[]> {
  return apiFetch<EmpresaActual[]>("clientes/actuales");
}
