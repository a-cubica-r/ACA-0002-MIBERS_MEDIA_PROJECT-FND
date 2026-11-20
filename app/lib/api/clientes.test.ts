import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCliente, listClientes, updateCliente } from "./clientes";
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(
    async () => new Response("{}", { headers: { "Content-Type": "application/json" } }),
  );
});
afterEach(() => vi.unstubAllGlobals());
const input = {
  nombre: "Prueba",
  posts_por_semana: 5,
  contrato_inicio: "2026-11-20",
  estrategia: "VENDER" as const,
};
describe("API de clientes", () => {
  it("envía JSON cuando no hay un archivo", async () => {
    await createCliente(input);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/clientes");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify(input));
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });
  it("envía multipart al actualizar con manual y omite valores nulos", async () => {
    const file = new File(["manual"], "manual.pdf");
    await updateCliente("a/b", {
      ...input,
      manual_marca: file,
      contrato_fin: null,
      objetivo: undefined,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/clientes/a%2Fb");
    expect(init?.method).toBe("PATCH");
    const body = init?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("manual_marca")).toBe(file);
    expect(body.get("posts_por_semana")).toBe("5");
    expect(body.has("contrato_fin")).toBe(false);
    expect(body.has("objetivo")).toBe(false);
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });
  it("conserva null en JSON para borrar la fecha final", async () => {
    await updateCliente("1", { contrato_fin: null });
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"contrato_fin":null}');
  });
  it("serializa filtros y paginación, incluyendo activo false", async () => {
    await listClientes({
      activo: false,
      estrategia: "VIRALIZAR",
      search: "Café & Arte",
      page: 2,
      pageSize: 25,
    });
    const query = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({
      activo: "false",
      estrategia: "VIRALIZAR",
      search: "Café & Arte",
      page: "2",
      page_size: "25",
    });
  });
  it("omite filtros vacíos", async () => {
    await listClientes({ search: "", activo: undefined });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/clientes");
  });
});
