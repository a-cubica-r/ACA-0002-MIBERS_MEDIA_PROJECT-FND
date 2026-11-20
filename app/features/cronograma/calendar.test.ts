import { describe, expect, it } from "vitest";
import type { PiezaResumen } from "~/lib/api/types";
import {
  colombiaDay,
  groupByColombiaDay,
  monthDays,
  movePeriod,
  validDay,
  weekStart,
} from "./calendar";

describe("calendario de Colombia", () => {
  it("inicia la semana el lunes incluso al cruzar de año", () => {
    expect(weekStart("2027-01-03")).toBe("2026-12-28");
    expect(weekStart("2026-11-23")).toBe("2026-11-23");
  });
  it("rellena el mes hasta completar semanas y contempla año bisiesto", () => {
    const days = monthDays("2024-02-15");
    expect(days[0]).toBe("2024-01-29");
    expect(days.at(-1)).toBe("2024-03-03");
    expect(days).toHaveLength(35);
    expect(days).toContain("2024-02-29");
    expect(monthDays("2026-03-01")).toHaveLength(42);
  });
  it("agrupa por fecha de Colombia al cruzar medianoche UTC", () => {
    const pieces = [
      { id: "1", programada_para: "2026-11-21T03:00:00Z" },
      { id: "2", programada_para: "2026-11-21T05:00:00Z" },
      { id: "3", programada_para: null },
    ] as PiezaResumen[];
    const result = groupByColombiaDay(pieces);
    expect(result["2026-11-20"][0].id).toBe("1");
    expect(result["2026-11-21"][0].id).toBe("2");
    expect(colombiaDay("2026-11-21T03:00:00Z")).toBe("2026-11-20");
  });
  it("navega meses sin saltarlos y valida fechas puras", () => {
    expect(movePeriod("2026-01-31", "mes", 1)).toBe("2026-02-01");
    expect(movePeriod("2026-01-01", "semana", -1)).toBe("2025-12-25");
    expect(validDay("2026-02-30")).toBe(false);
    expect(validDay("2026-02-28")).toBe(true);
  });
});
