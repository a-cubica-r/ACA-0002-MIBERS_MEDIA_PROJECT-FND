import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPoliticaVigente } from "./legal";

const fetchMock = vi.fn<typeof fetch>();

const politica = {
  id: "3f0c1d0e-6a4f-4c39-9e2a-8f6f4f1c9b01",
  version: "1.0",
  titulo: "Política de tratamiento de datos personales",
  contenido: "Mibers Creativos trata los datos personales conforme a la Ley 1581 de 2012.",
  vigente_desde: "2026-11-20",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe("getPoliticaVigente", () => {
  it("devuelve null cuando la API responde 404", async () => {
    fetchMock.mockResolvedValueOnce(
      respond({ code: "policy_not_published", detail: "No hay una política publicada." }, 404),
    );

    await expect(getPoliticaVigente()).resolves.toBeNull();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/legal/politica");
  });

  it("devuelve la política vigente cuando la API responde 200", async () => {
    fetchMock.mockResolvedValueOnce(respond(politica));

    await expect(getPoliticaVigente()).resolves.toEqual(politica);
  });

  it("consulta el endpoint público sin token de sesión", async () => {
    fetchMock.mockResolvedValueOnce(respond(politica));

    await getPoliticaVigente();

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });
});
