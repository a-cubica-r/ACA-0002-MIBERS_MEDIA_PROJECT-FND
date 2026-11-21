import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listAlertas, marcarAlertaLeida } from "./alertas";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), {
        headers: { "Content-Type": "application/json" },
      }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("API de alertas", () => {
  it("lista con filtro de leída y número de página", async () => {
    await listAlertas({ leida: false, page: 2 });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("alertas?");
    const query = new URL(String(url), "http://localhost").searchParams;
    expect(query.get("leida")).toBe("false");
    expect(query.get("page")).toBe("2");
  });

  it("marca una alerta como leída con POST", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "a/1" }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    await marcarAlertaLeida("a/1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/alertas/a%2F1/leer");
    expect(init?.method).toBe("POST");
  });
});
