import { describe, expect, it } from "vitest";
import { passwordSchema, usuarioCreateSchema, usuarioUpdateSchema } from "./schemas";

const user = {
  username: "ana.rojas",
  first_name: "Ana",
  last_name: "Rojas",
  role: "STAFF",
  cargo: "Diseño",
  whatsapp_number: "",
};

describe("esquemas de usuarios", () => {
  it("normaliza los campos y permite omitir WhatsApp", () => {
    expect(usuarioCreateSchema.parse({ ...user, username: " ana.rojas " })).toMatchObject({
      username: "ana.rojas",
      whatsapp_number: null,
    });
  });
  it("acepta teléfonos internacionales y rechaza números locales", () => {
    expect(
      usuarioCreateSchema.safeParse({ ...user, whatsapp_number: "+573001112233" }).success,
    ).toBe(true);
    expect(usuarioCreateSchema.safeParse({ ...user, whatsapp_number: "3001112233" }).success).toBe(
      false,
    );
  });
  it("rechaza roles fuera del contrato y usuarios vacíos o con espacios", () => {
    expect(usuarioCreateSchema.safeParse({ ...user, role: "CLIENT" }).success).toBe(false);
    expect(usuarioCreateSchema.safeParse({ ...user, username: "   " }).success).toBe(false);
    expect(usuarioCreateSchema.safeParse({ ...user, username: "ana rojas" }).success).toBe(false);
  });
  it("excluye el usuario de los datos editables", () => {
    expect(usuarioUpdateSchema.parse(user)).not.toHaveProperty("username");
  });
});
describe("cambio de contraseña", () => {
  const credentials = {
    current_password: "Temporal.2026",
    new_password: "Nueva.Segura2026",
    confirm_password: "Nueva.Segura2026",
  };
  it("acepta una contraseña nueva confirmada", () => {
    expect(passwordSchema.safeParse(credentials).success).toBe(true);
  });
  it("rechaza contraseña corta, igual a la actual o sin confirmación coincidente", () => {
    expect(passwordSchema.safeParse({ ...credentials, new_password: "corta" }).success).toBe(false);
    expect(
      passwordSchema.safeParse({
        ...credentials,
        new_password: credentials.current_password,
        confirm_password: credentials.current_password,
      }).success,
    ).toBe(false);
    const result = passwordSchema.safeParse({
      ...credentials,
      confirm_password: "Otra.Segura2026",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["confirm_password"]);
  });
});
