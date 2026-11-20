import { describe, expect, it } from "vitest";
import { colombiaToIso, isoToColombia, piezaSchema } from "./schemas";
const valid = {
  cliente: "cliente-id",
  titulo: "Campaña",
  tipo: "POST",
  programada_para: "2026-12-01T08:30",
  redes: "INSTAGRAM,FACEBOOK",
  copy_comun: "Copy común",
  distinto: "false",
  hashtags: "#Hola, Mibers",
  enlaces: "https://example.com",
  campana: "",
  responsable: "",
  mensaje_cliente: "",
};
describe("Ficha de pieza", () => {
  it("requiere al menos una red y un copy común", () => {
    expect(piezaSchema.safeParse({ ...valid, redes: "" }).success).toBe(false);
    expect(piezaSchema.safeParse({ ...valid, copy_comun: " " }).success).toBe(false);
  });
  it("exige copy propio por cada red cuando el interruptor está activo", () => {
    expect(piezaSchema.safeParse({ ...valid, distinto: "true", INSTAGRAM: "IG" }).success).toBe(
      false,
    );
    const parsed = piezaSchema.parse({
      ...valid,
      distinto: "true",
      INSTAGRAM: " IG ",
      FACEBOOK: "FB",
    });
    expect(parsed.redes).toEqual([
      { red: "INSTAGRAM", copy: "IG" },
      { red: "FACEBOOK", copy: "FB" },
    ]);
  });
  it("envía copy vacío por red para heredar el común", () => {
    expect(piezaSchema.parse(valid).redes.every((r) => r.copy === "")).toBe(true);
  });
  it("rechaza enlaces o fecha inválidos", () => {
    expect(piezaSchema.safeParse({ ...valid, enlaces: "texto" }).success).toBe(false);
    expect(piezaSchema.safeParse({ ...valid, programada_para: "ayer" }).success).toBe(false);
    expect(piezaSchema.safeParse({ ...valid, programada_para: "2026-02-31T12:00" }).success).toBe(
      false,
    );
  });
});
describe("Hora de Colombia independiente del equipo", () => {
  it("convierte con offset -05 y cruza el día y año", () => {
    expect(colombiaToIso("2026-12-31T23:30")).toBe("2027-01-01T04:30:00.000Z");
    expect(isoToColombia("2027-01-01T04:30:00Z")).toBe("2026-12-31T23:30");
    expect(isoToColombia(null)).toBe("");
  });
  it("mantiene la hora local al completar la conversión en ambos sentidos", () => {
    expect(isoToColombia(colombiaToIso("2026-06-15T08:00"))).toBe("2026-06-15T08:00");
  });
});
