import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listAuditoria } from "./auditoria";

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

describe("API de auditoría", () => {
  it("lista con filtros y omite el actor cuando no tiene valor", async () => {
    await listAuditoria({ page: 2, action: "LOGIN", desde: "2026-11-01" });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("auditoria?");
    const query = new URL(String(url), "http://localhost").searchParams;
    expect(query.get("page")).toBe("2");
    expect(query.get("page_size")).toBe("25");
    expect(query.get("action")).toBe("LOGIN");
    expect(query.get("desde")).toBe("2026-11-01");
    expect(query.has("actor")).toBe(false);
  });
});
