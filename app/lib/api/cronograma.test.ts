import { afterEach, expect, it, vi } from "vitest";
import { getCronograma } from "./cronograma";
afterEach(() => vi.unstubAllGlobals());
it("consulta el cliente codificado con filtros reales", async () => {
  const fetchMock = vi.fn(async () => new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  await getCronograma("a/b", {
    vista: "mes",
    fecha: "2026-11-20",
    red: "INSTAGRAM",
    estado: "PROGRAMADA",
  });
  expect(fetchMock.mock.calls[0]).toBeDefined();
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/clientes/a%2Fb/cronograma?vista=mes&fecha=2026-11-20&red=INSTAGRAM&estado=PROGRAMADA",
    expect.any(Object),
  );
});
