import { describe, expect, it } from "vitest";
import { shiftMonth, tasaInteraccion, total, variacion } from "./calculos";
import type { Metrica } from "~/lib/api/metricas";
describe("indicadores mensuales", () => {
  it("calcula incrementos, caídas y cero actual", () => {
    expect(variacion(150, 100)).toBe(50);
    expect(variacion(50, 100)).toBe(-50);
    expect(variacion(0, 100)).toBe(-100);
    expect(variacion(100, 100)).toBe(0);
  });
  it("no inventa variaciones sin base comparable", () => {
    expect(variacion(100, 0)).toBeNull();
    expect(variacion(null, 100)).toBeNull();
    expect(variacion(100, null)).toBeNull();
    expect(variacion(0, 0)).toBeNull();
  });
  it("calcula la tasa y maneja datos faltantes o alcance cero", () => {
    expect(tasaInteraccion(30, 1000)).toBe(3);
    expect(tasaInteraccion(0, 1000)).toBe(0);
    expect(tasaInteraccion(30, 0)).toBeNull();
    expect(tasaInteraccion(null, 1000)).toBeNull();
    expect(tasaInteraccion(30, null)).toBeNull();
  });
  it("conserva datos incompletos y cambia de año", () => {
    expect(total([], "alcance")).toBeNull();
    expect(total([{ alcance: 0 }, { alcance: null }] as Metrica[], "alcance")).toBeNull();
    expect(total([{ alcance: 0 }, { alcance: 20 }] as Metrica[], "alcance")).toBe(20);
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
