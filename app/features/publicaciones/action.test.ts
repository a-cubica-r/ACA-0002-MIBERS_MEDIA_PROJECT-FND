import { RouterContextProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/lib/api/errors";
import { clientAction } from "~/routes/publicaciones";
import {
  confirmarPublicacion,
  fallarPublicacion,
  reintentarPublicacion,
} from "~/lib/api/publicaciones";
vi.mock("~/lib/auth/guards", () => ({ requireUser: vi.fn(async () => ({})) }));
vi.mock("~/lib/api/publicaciones", () => ({
  confirmarPublicacion: vi.fn(),
  fallarPublicacion: vi.fn(),
  reintentarPublicacion: vi.fn(),
  listPublicaciones: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
async function action(fields: Record<string, string>) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  return clientAction({
    request: new Request("http://localhost/publicaciones", { method: "POST", body }),
    url: new URL("http://localhost/publicaciones"),
    pattern: "/publicaciones",
    params: {},
    context: new RouterContextProvider(),
    serverAction: async () => undefined,
  });
}
describe("acciones de publicación", () => {
  it("no muta cuando URL o motivo son inválidos", async () => {
    expect((await action({ id: "1", intent: "confirmar", enlace: "javascript:alert(1)" })).ok).toBe(
      false,
    );
    expect((await action({ id: "1", intent: "fallar", motivo: "  " })).ok).toBe(false);
    expect(confirmarPublicacion).not.toHaveBeenCalled();
    expect(fallarPublicacion).not.toHaveBeenCalled();
  });
  it("confirma con URL recortada, reporta y reintenta", async () => {
    expect(
      await action({ id: "1", intent: "confirmar", enlace: " https://instagram.com/p/123 " }),
    ).toEqual({ ok: true });
    expect(confirmarPublicacion).toHaveBeenCalledWith("1", "https://instagram.com/p/123");
    await action({ id: "1", intent: "fallar", motivo: " Error de red " });
    expect(fallarPublicacion).toHaveBeenCalledWith("1", "Error de red");
    await action({ id: "1", intent: "reintentar" });
    expect(reintentarPublicacion).toHaveBeenCalledWith("1");
  });
  it("devuelve errores de transición del backend", async () => {
    vi.mocked(reintentarPublicacion).mockRejectedValue(
      new ApiError(409, { detail: "La cuenta está expirada." }),
    );
    expect(await action({ id: "1", intent: "reintentar" })).toMatchObject({
      ok: false,
      error: "La cuenta está expirada.",
    });
  });
});
