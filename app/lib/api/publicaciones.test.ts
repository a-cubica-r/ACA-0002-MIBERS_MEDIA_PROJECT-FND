import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  confirmarPublicacion,
  fallarPublicacion,
  listPublicaciones,
  reintentarPublicacion,
} from "./publicaciones";
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => new Response("{}"));
});
afterEach(() => vi.unstubAllGlobals());
it("lista pendientes paginadas y todas sin estado", async () => {
  await listPublicaciones("PENDIENTE", 2);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/publicaciones?page=2&estado=PENDIENTE");
  await listPublicaciones();
  expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/publicaciones?page=1");
});
it("envía enlace, motivo y reintento con POST", async () => {
  await confirmarPublicacion("a/b", "https://example.com/post");
  await fallarPublicacion("123", "Red no disponible");
  await reintentarPublicacion("123");
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/publicaciones/a%2Fb/confirmar");
  expect(fetchMock.mock.calls[0][1]?.body).toBe(
    JSON.stringify({ enlace: "https://example.com/post" }),
  );
  expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({ motivo: "Red no disponible" }));
  expect(fetchMock.mock.calls[2][0]).toBe("/api/v1/publicaciones/123/reintentar");
  expect(fetchMock.mock.calls.every((call) => call[1]?.method === "POST")).toBe(true);
});
