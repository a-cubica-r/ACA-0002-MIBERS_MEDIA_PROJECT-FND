import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listEnvios, listEnviosPieza } from "./envios";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () =>
    Response.json({ count: 0, next: null, previous: null, results: [] }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("API de envíos al cliente", () => {
  it("lista con los filtros indicados y omite los vacíos", async () => {
    await listEnvios({ cliente: "c1", estado: "FALLIDO", desde: "2026-11-01", hasta: "", page: 2 });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url.startsWith("/api/v1/envios?")).toBe(true);
    const query = new URL(url, "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({
      cliente: "c1",
      estado: "FALLIDO",
      desde: "2026-11-01",
      page: "2",
      page_size: "25",
    });
  });
  it("pide la primera página por defecto y filtra por pieza", async () => {
    await listEnvios({ pieza: "p1" });
    const query = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost").searchParams;
    expect(query.get("pieza")).toBe("p1");
    expect(query.get("page")).toBe("1");
  });
  it("lista los envíos de una pieza", async () => {
    fetchMock.mockResolvedValueOnce(Response.json([]));
    await expect(listEnviosPieza("a/b")).resolves.toEqual([]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/piezas/a%2Fb/envios");
  });
});
