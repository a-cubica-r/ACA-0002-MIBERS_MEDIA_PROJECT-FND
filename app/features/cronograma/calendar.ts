import type { PiezaResumen } from "~/lib/api/types";

export function colombiaDay(value: string | Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((part) => parts.find((p) => p.type === part)!.value)
    .join("-");
}
export function validDay(value: string | null): value is string {
  return (
    !!value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function weekStart(day: string): string {
  return addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));
}
export function monthDays(day: string): string[] {
  const first = `${day.slice(0, 7)}-01`;
  const last = new Date(`${first}T00:00:00Z`);
  last.setUTCMonth(last.getUTCMonth() + 1);
  last.setUTCDate(0);
  const end = addDays(weekStart(last.toISOString().slice(0, 10)), 6);
  const result: string[] = [];
  for (let cursor = weekStart(first); cursor <= end; cursor = addDays(cursor, 1))
    result.push(cursor);
  return result;
}
export function movePeriod(day: string, view: "semana" | "mes", direction: number): string {
  if (view === "semana") return addDays(day, direction * 7);
  const date = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + direction);
  return date.toISOString().slice(0, 10);
}
export function groupByColombiaDay(piezas: PiezaResumen[]): Record<string, PiezaResumen[]> {
  const groups: Record<string, PiezaResumen[]> = {};
  for (const pieza of piezas)
    if (pieza.programada_para) (groups[colombiaDay(pieza.programada_para)] ??= []).push(pieza);
  return groups;
}
export function colombiaTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
