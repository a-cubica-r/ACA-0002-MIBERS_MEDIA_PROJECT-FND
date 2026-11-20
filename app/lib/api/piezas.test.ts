import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listPiezas, piezaTransition, reorderArchivos, uploadArchivo } from "./piezas";
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(
    async () => new Response("{}", { headers: { "Content-Type": "application/json" } }),
  );
});
afterEach(() => vi.unstubAllGlobals());
describe("API de piezas", () => {
  it("serializa filtros sin perder valores", async () => {
    await listPiezas({
      cliente: "a",
      estado: "EN_REVISION",
      tipo: "HISTORIA",
      red: "INSTAGRAM",
      desde: "2026-12-01",
      hasta: "2026-12-31",
      page: 2,
    });
    const query = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost").searchParams;
    expect(query.get("tipo")).toBe("HISTORIA");
    expect(query.get("page")).toBe("2");
    expect(query.get("desde")).toBe("2026-12-01");
  });
  it("envía un archivo multipart sin fijar Content-Type", async () => {
    const file = new File(["contenido"], "post.png");
    await uploadArchivo("id", file);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/piezas/id/archivos");
    expect((init?.body as FormData).get("archivo")).toBe(file);
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });
  it("confirma explícitamente programación y preserva orden completo", async () => {
    await piezaTransition("id", "programar");
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"confirmar":true}');
    await reorderArchivos("id", ["b", "a"]);
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PUT");
    expect(fetchMock.mock.calls[1][1]?.body).toBe('{"ids":["b","a"]}');
  });
});
