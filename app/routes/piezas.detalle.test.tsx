import { RouterContextProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { envioDePrueba } from "~/features/envios/fixtures";
import { clearSession, setCachedUser, setTokens } from "~/lib/auth/session";
import type { Usuario } from "~/lib/api/types";
import { clientLoader } from "./piezas.detalle";

const fetchMock = vi.fn<typeof fetch>();
let enviosResponse: () => Response;

function load() {
  const url = new URL("http://localhost/piezas/p1");
  return clientLoader({
    request: new Request(url),
    url,
    pattern: "/piezas/:piezaId",
    params: { piezaId: "p1" },
    context: new RouterContextProvider(),
  } as never);
}

beforeEach(() => {
  setTokens({ access: "a", refresh: "r" });
  setCachedUser({ role: "STAFF", must_change_password: false } as Usuario);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url === "/api/v1/piezas/p1/envios") return enviosResponse();
    if (url === "/api/v1/piezas/p1/revisiones") return Response.json([]);
    if (url === "/api/v1/piezas/p1") return Response.json({ id: "p1", estado: "PUBLICADA" });
    return new Response(null, { status: 404 });
  });
});
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});

describe("detalle de la pieza: envíos al cliente", () => {
  it("carga los envíos de la pieza", async () => {
    enviosResponse = () => Response.json([envioDePrueba("LEIDO")]);
    const data = await load();
    expect(data.envios).toEqual({ items: [envioDePrueba("LEIDO")], error: null });
  });
  it("un error del registro de envíos no impide ver la pieza", async () => {
    enviosResponse = () => Response.json({ detail: "Servicio no disponible." }, { status: 503 });
    const data = await load();
    expect(data.pieza).toMatchObject({ id: "p1" });
    expect(data.envios).toEqual({ items: null, error: "Servicio no disponible." });
  });
});
