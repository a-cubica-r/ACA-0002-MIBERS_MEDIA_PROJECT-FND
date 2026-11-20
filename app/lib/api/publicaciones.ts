import { apiDownload, apiFetch } from "./client";
import type { Paginated, Red, TipoPieza } from "./types";

export type EstadoPublicacion = "PENDIENTE" | "PUBLICADA" | "FALLIDA" | "CANCELADA";
export interface TareaPublicacion {
  id: string;
  pieza: string;
  pieza_titulo: string;
  pieza_tipo: TipoPieza;
  cliente: string;
  cliente_nombre: string;
  red: Red;
  cuenta_handle: string;
  cuenta_url: string;
  estado: EstadoPublicacion;
  copy_final: string;
  programada_para: string;
  avisada_at: string | null;
  enlace: string;
  motivo: string;
  publicada_at: string | null;
  gestionada_por: string | null;
  gestionada_por_username: string;
  intentos: number;
  modo: "MANUAL" | "AUTOMATICA";
  externo_contenedor_id: string;
  externo_post_id: string;
  externo_estado: string;
}
export interface ArchivoPublicacion {
  id: string;
  nombre_original: string;
  url: string;
}
export function listPublicaciones(
  estado?: EstadoPublicacion,
  page = 1,
): Promise<Paginated<TareaPublicacion>> {
  const query = new URLSearchParams({ page: String(page) });
  if (estado) query.set("estado", estado);
  return apiFetch(`publicaciones?${query}`);
}
const path = (id: string) => `publicaciones/${encodeURIComponent(id)}`;
export const getPublicacion = (id: string): Promise<TareaPublicacion> => apiFetch(path(id));
export const confirmarPublicacion = (id: string, enlace: string): Promise<TareaPublicacion> =>
  apiFetch(`${path(id)}/confirmar`, { method: "POST", json: { enlace } });
export const fallarPublicacion = (id: string, motivo: string): Promise<TareaPublicacion> =>
  apiFetch(`${path(id)}/fallar`, { method: "POST", json: { motivo } });
export const reintentarPublicacion = (id: string): Promise<TareaPublicacion> =>
  apiFetch(`${path(id)}/reintentar`, { method: "POST" });
export async function getArchivosPublicacion(pieza: string): Promise<ArchivoPublicacion[]> {
  const result = await apiFetch<{ archivos: ArchivoPublicacion[] }>(
    `piezas/${encodeURIComponent(pieza)}`,
  );
  return result.archivos;
}
export const descargarArchivoPublicacion = (id: string) =>
  apiDownload(`archivos/${encodeURIComponent(id)}`);
