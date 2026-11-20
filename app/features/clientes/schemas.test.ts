import { describe, expect, it } from "vitest";
import { clienteSchema, contactoSchema, MAX_MANUAL_SIZE } from "./schemas";
const input = {
  nombre: "Café",
  posts_por_semana: "5",
  contrato_inicio: "2026-11-20",
  estrategia: "VENDER",
};
describe("validación de clientes", () => {
  it("permite fecha final vacía o igual al inicio", () => {
    expect(clienteSchema.safeParse({ ...input, contrato_fin: "" }).success).toBe(true);
    expect(clienteSchema.safeParse({ ...input, contrato_fin: "2026-11-20" }).success).toBe(true);
  });
  it("rechaza fecha final anterior y fechas inexistentes", () => {
    expect(clienteSchema.safeParse({ ...input, contrato_fin: "2026-11-19" }).success).toBe(false);
    expect(clienteSchema.safeParse({ ...input, contrato_inicio: "2026-02-30" }).success).toBe(
      false,
    );
  });
  it.each([0, 15, 1.5, ""])("rechaza plan %s", (posts_por_semana) => {
    expect(clienteSchema.safeParse({ ...input, posts_por_semana }).success).toBe(false);
  });
  it.each([1, 14])("permite plan %s", (posts_por_semana) => {
    expect(clienteSchema.safeParse({ ...input, posts_por_semana }).success).toBe(true);
  });
  it("rechaza manual mayor de 25 MB y extensión inválida", () => {
    const file = new File(["x"], "manual.pdf");
    Object.defineProperty(file, "size", { value: MAX_MANUAL_SIZE + 1 });
    expect(clienteSchema.safeParse({ ...input, manual_marca: file }).success).toBe(false);
    expect(
      clienteSchema.safeParse({ ...input, manual_marca: new File(["x"], "manual.exe") }).success,
    ).toBe(false);
  });
  it("acepta archivo vacío como campo sin adjunto", () => {
    const result = clienteSchema.parse({ ...input, manual_marca: new File([], "") });
    expect(result.manual_marca).toBeUndefined();
  });
  it("valida teléfonos E.164 en contacto principal", () => {
    expect(clienteSchema.safeParse({ ...input, contacto_telefono: "+573001112233" }).success).toBe(
      true,
    );
    expect(clienteSchema.safeParse({ ...input, contacto_telefono: "3001112233" }).success).toBe(
      false,
    );
  });
});
describe("autorización WhatsApp", () => {
  it("no autoriza al contacto si no se marcó el checkbox", () => {
    expect(contactoSchema.parse({ nombre: "Ana", numero: "+573001112233" }).autorizado).toBe(false);
    expect(
      contactoSchema.parse({ nombre: "Ana", numero: "+573001112233", autorizado: "on" }).autorizado,
    ).toBe(true);
  });
  it.each(["3001112233", "+0123456789", "+123", "+57300 1112233"])("rechaza %s", (numero) => {
    expect(contactoSchema.safeParse({ nombre: "Ana", numero }).success).toBe(false);
  });
});
