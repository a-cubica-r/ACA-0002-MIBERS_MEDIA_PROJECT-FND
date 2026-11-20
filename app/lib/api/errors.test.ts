import { describe, expect, it } from "vitest";
import { ApiError, isApiError } from "./errors";
describe("ApiError", () => {
  it("reads string detail", () => {
    const error = new ApiError(401, {
      code: "invalid_credentials",
      detail: "Credenciales incorrectas.",
    });
    expect(error.message).toBe("Credenciales incorrectas.");
    expect(error.status).toBe(401);
    expect(error.code).toBe("invalid_credentials");
    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error())).toBe(false);
  });
  it("takes the first message per field and separates non-field errors", () => {
    const error = new ApiError(400, {
      detail: { nombre: ["Requerido.", "Otro."], email: "Inválido." },
    });
    expect(error.fieldErrors).toEqual({ nombre: "Requerido.", email: "Inválido." });
    expect(error.message).toBe("Revisa los campos marcados.");
    expect(new ApiError(400, { detail: { non_field_errors: ["Error general."] } }).message).toBe(
      "Error general.",
    );
  });
  it("joins list detail", () => {
    expect(new ApiError(400, { detail: ["Primero.", "Segundo."] }).message).toBe(
      "Primero. Segundo.",
    );
  });
  it("normalizes network errors", () => {
    expect(new ApiError(0)).toMatchObject({
      status: 0,
      code: "network_error",
      message: "No se pudo conectar con el servidor.",
    });
  });
});
