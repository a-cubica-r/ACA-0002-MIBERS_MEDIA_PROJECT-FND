import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allMetricas, listMetricas, saveMetricas, syncMetricas } from "./metricas";
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json({}));
});
afterEach(() => vi.unstubAllGlobals());
describe("API de métricas", () => {
  it("serializa los filtros del contrato real", async () => {
    await listMetricas({
      cliente: "cliente",
      red: "INSTAGRAM",
      desde: "2026-06",
      hasta: "2026-11",
      page: 2,
    });
    const query = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({
      cliente: "cliente",
      red: "INSTAGRAM",
      desde: "2026-06",
      hasta: "2026-11",
      page: "2",
    });
  });
  it("guarda cero y nulos por PUT y sincroniza por POST", async () => {
    await saveMetricas("id", { red: "FACEBOOK", mes: "2026-10", alcance: 0, seguidores: null });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/clientes/id/metricas");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PUT");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      red: "FACEBOOK",
      mes: "2026-10",
      alcance: 0,
      seguidores: null,
    });
    await syncMetricas("id", "2026-11");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/clientes/id/metricas/sincronizar");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("POST");
  });
  it("recorre todas las páginas sin seguir URLs externas de next", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({ results: [{ id: "a" }], next: "http://api/metricas?page=2" }),
      )
      .mockResolvedValueOnce(Response.json({ results: [{ id: "b" }], next: null }));
    expect(await allMetricas({ cliente: "id" })).toEqual([{ id: "a" }, { id: "b" }]);
    expect(String(fetchMock.mock.calls[1][0])).toContain("page=2");
  });
});
