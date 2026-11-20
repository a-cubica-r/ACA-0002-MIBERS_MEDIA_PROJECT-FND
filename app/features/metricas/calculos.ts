import type { Metrica, MetricField } from "~/lib/api/metricas";

export function variacion(actual: number | null, anterior: number | null): number | null {
  return actual === null || anterior === null || anterior === 0
    ? null
    : ((actual - anterior) / anterior) * 100;
}
export function tasaInteraccion(
  interacciones: number | null,
  alcance: number | null,
): number | null {
  return interacciones === null || alcance === null || alcance === 0
    ? null
    : (interacciones / alcance) * 100;
}
export function total(rows: Metrica[], field: MetricField): number | null {
  const values = rows.map((row) => row[field]);
  return !values.length || values.some((value) => value === null)
    ? null
    : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}
export function currentMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}
export function shiftMonth(month: string, offset: number): string {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, index - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}
export const numberLabel = (value: number | null) =>
  value === null
    ? "Sin dato"
    : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value);
export const percentLabel = (value: number | null) =>
  value === null ? "Sin comparación" : `${value > 0 ? "+" : ""}${numberLabel(value)} %`;
export const METRIC_LABEL = {
  alcance: "Alcance",
  visualizaciones: "Visualizaciones",
  interacciones: "Interacciones",
  seguidores: "Seguidores",
};
