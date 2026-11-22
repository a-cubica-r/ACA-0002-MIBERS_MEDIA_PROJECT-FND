import type { EstadoEnvio } from "~/lib/api/types";
import { ESTADO_ENVIO_LABEL } from "~/lib/format";

export const ESTADOS_ENVIO = Object.keys(ESTADO_ENVIO_LABEL) as EstadoEnvio[];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export interface FiltrosEnvios {
  cliente: string;
  estado: EstadoEnvio | "";
  desde: string;
  hasta: string;
  page: number;
}

/** Lee los filtros de la URL y descarta valores inválidos. */
export function parseFiltros(query: URLSearchParams): FiltrosEnvios {
  const page = Number(query.get("page") ?? "1");
  const estado = query.get("estado") ?? "";
  const fecha = (key: string) => {
    const value = query.get(key) ?? "";
    return FECHA.test(value) ? value : "";
  };
  return {
    cliente: query.get("cliente") ?? "",
    estado: ESTADOS_ENVIO.find((item) => item === estado) ?? "",
    desde: fecha("desde"),
    hasta: fecha("hasta"),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function filtrosHref(filtros: FiltrosEnvios, page: number): string {
  const params = new URLSearchParams();
  for (const key of ["cliente", "estado", "desde", "hasta"] as const)
    if (filtros[key]) params.set(key, filtros[key]);
  params.set("page", String(page));
  return `?${params}`;
}
