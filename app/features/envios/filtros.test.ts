import { describe, expect, it } from "vitest";
import { filtrosHref, parseFiltros } from "./filtros";

describe("filtros del registro de envíos", () => {
  it("lee cliente, estado, fechas y página de la URL", () => {
    const query = new URLSearchParams(
      "cliente=c1&estado=LEIDO&desde=2026-11-01&hasta=2026-11-30&page=3",
    );
    expect(parseFiltros(query)).toEqual({
      cliente: "c1",
      estado: "LEIDO",
      desde: "2026-11-01",
      hasta: "2026-11-30",
      page: 3,
    });
  });
  it("descarta valores inválidos", () => {
    const query = new URLSearchParams("estado=BORRADO&desde=ayer&hasta=2026-13&page=-2");
    expect(parseFiltros(query)).toEqual({
      cliente: "",
      estado: "",
      desde: "",
      hasta: "",
      page: 1,
    });
  });
  it("conserva los filtros al paginar", () => {
    const filtros = parseFiltros(new URLSearchParams("estado=FALLIDO&page=1"));
    expect(filtrosHref(filtros, 2)).toBe("?estado=FALLIDO&page=2");
  });
});
