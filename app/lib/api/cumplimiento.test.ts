import { afterEach, expect, it, vi } from "vitest";
import { getCumplimiento } from "./cumplimiento";

afterEach(() => vi.unstubAllGlobals());

it("consulta cumplimiento y envía solo fechas con valor", async () => {
  const result = { total: 10, dentro_de_5_min: 10, porcentaje: 100, meta: 95 };
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementation(
      async () =>
        new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } }),
    );
  vi.stubGlobal("fetch", fetchMock);
  expect(await getCumplimiento()).toEqual(result);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/publicaciones/cumplimiento");
  await getCumplimiento({ desde: "2026-11-01", hasta: "" });
  expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/publicaciones/cumplimiento?desde=2026-11-01");
  await getCumplimiento({ hasta: "2026-11-20" });
  expect(fetchMock.mock.calls[2][0]).toBe("/api/v1/publicaciones/cumplimiento?hasta=2026-11-20");
});
