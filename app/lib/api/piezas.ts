import { apiDownload, apiFetch } from "./client";
import type { CuentaSocial, EstadoPieza, Paginated, PiezaResumen, Red, TipoPieza } from "./types";
export interface ArchivoPieza {
  id: string;
  nombre_original: string;
  orden: number;
  kind: "image" | "video";
  formato: string;
  tamano: number;
  ancho: number;
  alto: number;
  duracion: number | null;
  url: string;
}
export interface Pieza extends Omit<PiezaResumen, "redes" | "archivos_count"> {
  redes: { red: Red; copy: string; copy_final: string }[];
  copy_comun: string;
  hashtags: string[];
  enlaces: string[];
  campana: string;
  mensaje_cliente: string;
  archivos: ArchivoPieza[];
  tiene_archivo_editable: boolean;
  archivo_editable_nombre: string;
  created_at: string;
  updated_at: string;
}
export interface PiezaInput {
  cliente?: string;
  titulo: string;
  tipo: TipoPieza;
  programada_para: string | null;
  redes: { red: Red; copy: string }[];
  copy_comun: string;
  hashtags: string[];
  enlaces: string[];
  campana: string;
  responsable?: string | null;
  mensaje_cliente: string;
}
export interface Revision {
  id: string;
  decision: string;
  comentario: string;
  autor: string | null;
  autor_username: string;
  created_at: string;
}
export interface ProgramacionPreview {
  pieza: PiezaResumen;
  cliente: string;
  programada_para: string | null;
  redes: { red: Red; cuenta: CuentaSocial | null; copy_final: string }[];
  archivos: string[];
  problemas: string[];
  puede_confirmar: boolean;
}
export interface PiezaFilters {
  cliente?: string;
  estado?: EstadoPieza | string;
  tipo?: TipoPieza | string;
  red?: Red | string;
  desde?: string;
  hasta?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
const path = (id: string) => `piezas/${encodeURIComponent(id)}`;
export function listPiezas(filters: PiezaFilters = {}): Promise<Paginated<PiezaResumen>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return apiFetch(`piezas${query.size ? `?${query}` : ""}`);
}
export const getPieza = (id: string): Promise<Pieza> => apiFetch(path(id));
export const createPieza = (input: PiezaInput): Promise<Pieza> =>
  apiFetch("piezas", { method: "POST", json: input });
export const updatePieza = (id: string, input: Partial<PiezaInput>): Promise<Pieza> =>
  apiFetch(path(id), { method: "PATCH", json: input });
export const deletePieza = (id: string): Promise<void> => apiFetch(path(id), { method: "DELETE" });
export const listRevisiones = (id: string): Promise<Revision[]> =>
  apiFetch(`${path(id)}/revisiones`);
export const getProgramacion = (id: string): Promise<ProgramacionPreview> =>
  apiFetch(`${path(id)}/programacion`);
export const piezaTransition = (
  id: string,
  action:
    "enviar-revision" | "aprobar" | "solicitar-cambios" | "programar" | "cancelar-programacion",
  comentario = "",
): Promise<Pieza> =>
  apiFetch(`${path(id)}/${action}`, {
    method: "POST",
    json: action === "programar" ? { confirmar: true } : { comentario },
  });
export function uploadArchivo(
  id: string,
  file: File,
  editable = false,
): Promise<ArchivoPieza | Pieza> {
  const formData = new FormData();
  formData.append("archivo", file);
  return apiFetch(`${path(id)}/${editable ? "archivo-editable" : "archivos"}`, {
    method: "POST",
    formData,
  });
}
export const deleteArchivo = (id: string, fileId: string): Promise<void> =>
  apiFetch(`${path(id)}/archivos/${encodeURIComponent(fileId)}`, { method: "DELETE" });
export const reorderArchivos = (id: string, ids: string[]): Promise<Pieza> =>
  apiFetch(`${path(id)}/archivos/orden`, { method: "PUT", json: { ids } });
export const downloadArchivo = (id: string) => apiDownload(`archivos/${encodeURIComponent(id)}`);
export const downloadEditable = (id: string) => apiDownload(`${path(id)}/archivo-editable`);
