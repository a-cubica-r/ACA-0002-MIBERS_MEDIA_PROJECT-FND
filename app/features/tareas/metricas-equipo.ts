import type { Persona, Tarea } from "~/lib/api/tareas";
export const hoyColombia = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
export const esVencida = (t: Tarea, hoy = hoyColombia()) =>
  t.estado !== "COMPLETADA" && t.fecha_limite < hoy;
export interface FiltrosTareas {
  propias?: string;
  cliente?: string;
  persona?: string;
  vencidas?: boolean;
  tarea?: string;
}
export function filtrarTareas(
  tareas: Tarea[],
  filters: FiltrosTareas,
  hoy = hoyColombia(),
): Tarea[] {
  return tareas.filter(
    (t) =>
      (!filters.propias || t.asignado_a.id === filters.propias) &&
      (!filters.cliente || t.cliente_id === filters.cliente) &&
      (!filters.persona || t.asignado_a.id === filters.persona) &&
      (!filters.vencidas || esVencida(t, hoy)) &&
      (!filters.tarea || t.id === filters.tarea),
  );
}
export function metricasPersonas(tareas: Tarea[], personas: Persona[], now = new Date()) {
  const hoy = hoyColombia(now);
  const desde = now.getTime() - 7 * 86400000;
  const rows = personas.map((persona) => {
    const propias = tareas.filter((t) => t.asignado_a.id === persona.id);
    return {
      ...persona,
      abiertas: propias.filter((t) => t.estado !== "COMPLETADA").length,
      vencidas: propias.filter((t) => esVencida(t, hoy)).length,
      completadas: propias.filter(
        (t) =>
          t.estado === "COMPLETADA" &&
          t.completada_at &&
          Date.parse(t.completada_at) >= desde &&
          Date.parse(t.completada_at) <= now.getTime(),
      ).length,
    };
  });
  const max = Math.max(1, ...rows.map((row) => row.abiertas));
  return rows.map((row) => ({ ...row, carga: Math.round((row.abiertas / max) * 100) }));
}
export function metricasClientes(
  tareas: Tarea[],
  clientes: { id: string; nombre: string }[],
  hoy = hoyColombia(),
) {
  return clientes.map((cliente) => {
    const propias = tareas.filter((t) => t.cliente_id === cliente.id);
    const completadas = propias.filter((t) => t.estado === "COMPLETADA").length;
    return {
      ...cliente,
      total: propias.length,
      completadas,
      avance: propias.length ? Math.round((completadas / propias.length) * 100) : 0,
      vencidas: propias.filter((t) => esVencida(t, hoy)).length,
    };
  });
}
