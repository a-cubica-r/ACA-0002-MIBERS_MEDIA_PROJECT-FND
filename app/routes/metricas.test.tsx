import { render, screen } from "@testing-library/react";
import { MemoryRouter, RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, setCachedUser, setTokens } from "~/lib/auth/session";
import type { Usuario } from "~/lib/api/types";
import { MetricasTabs } from "~/features/metricas/metricas-tabs";
import * as tablero from "./metricas";
import * as carga from "./metricas.cargar";

const CLIENTE = "ceb62bf7-ef2b-416f-9896-970884c1df3e";
const admin: Usuario = {
  id: "u1",
  username: "director",
  first_name: "Ana",
  last_name: "Pérez",
  role: "ADMIN",
  cargo: "",
  whatsapp_number: null,
  is_active: true,
  must_change_password: false,
  last_login: null,
  date_joined: "2026-01-01T00:00:00Z",
};
const fetchMock = vi.fn<typeof fetch>();

function args(path: string, init?: RequestInit) {
  const url = new URL(path, "http://localhost");
  return {
    request: new Request(url, init),
    url,
    pattern: url.pathname,
    params: {},
    context: new RouterContextProvider(),
  };
}
function form(fields: Record<string, string>): RequestInit {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return { method: "POST", body };
}
const page = (results: unknown[]) =>
  Response.json({ count: results.length, next: null, previous: null, results });

beforeEach(() => {
  setTokens({ access: "a", refresh: "r" });
  setCachedUser(admin);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith("/api/v1/clientes?")) return page([{ id: CLIENTE, nombre: "Café" }]);
    if (url.startsWith("/api/v1/metricas?"))
      return page([{ id: "m1", cliente: CLIENTE, red: "INSTAGRAM", mes: "2026-10", alcance: 10 }]);
    if (url.endsWith("/metricas/sincronizar")) return Response.json([{ id: "m2" }]);
    if (url.endsWith(`/clientes/${CLIENTE}/metricas`)) return Response.json({ id: "m1" });
    return new Response(null, { status: 404 });
  });
});
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});

describe("/metricas sigue funcionando", () => {
  it("consulta las métricas del cliente seleccionado", async () => {
    const data = await tablero.clientLoader(
      args(`/metricas?cliente=${CLIENTE}&red=INSTAGRAM`) as never,
    );
    expect(data.cliente).toBe(CLIENTE);
    expect(data.rows).toHaveLength(1);
    const query = new URL(String(fetchMock.mock.calls[1][0]), "http://localhost").searchParams;
    expect(query.get("cliente")).toBe(CLIENTE);
    expect(query.get("red")).toBe("INSTAGRAM");
  });
  it("carga métricas manuales y vuelve al tablero", async () => {
    const response = await carga.clientAction(
      args(
        "/metricas/cargar",
        form({ cliente: CLIENTE, mes: "2026-10", INSTAGRAM_alcance: "1200" }),
      ) as never,
    );
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).headers.get("Location")).toBe(`/metricas?cliente=${CLIENTE}`);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/v1/clientes/${CLIENTE}/metricas`);
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toMatchObject({ red: "INSTAGRAM", alcance: 1200 });
  });
  it("sincroniza con Meta", async () => {
    const result = await tablero.clientAction(
      args("/metricas", form({ cliente: CLIENTE })) as never,
    );
    expect(result).toMatchObject({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/v1/clientes/${CLIENTE}/metricas/sincronizar`);
  });
  it("las pestañas ya no ofrecen el análisis con IA", () => {
    render(
      <MemoryRouter>
        <MetricasTabs cliente="" />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Tablero de indicadores",
      "Cargar métricas",
    ]);
  });
});
