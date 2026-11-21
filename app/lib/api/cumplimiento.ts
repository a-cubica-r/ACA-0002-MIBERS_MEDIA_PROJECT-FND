import { apiFetch } from "~/lib/api/client";

export interface Cumplimiento {
  total: number;
  dentro_de_5_min: number;
  porcentaje: number | null;
  meta: number;
}

export function getCumplimiento({ desde, hasta }: { desde?: string; hasta?: string } = {}) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const query = params.toString();
  return apiFetch<Cumplimiento>(`publicaciones/cumplimiento${query ? `?${query}` : ""}`);
}
