import { afterEach, describe, expect, it, vi } from "vitest";
import { redirectIfAuthenticated, requireAdmin, requireUser, sanitizeNext } from "./guards";
import { clearSession, setCachedUser, setTokens } from "./session";
import type { Usuario } from "../api/types";
const user: Usuario = {
  id: "1",
  username: "ana",
  first_name: "Ana",
  last_name: "",
  role: "STAFF",
  cargo: "",
  whatsapp_number: null,
  is_active: true,
  must_change_password: false,
  last_login: null,
  date_joined: "2026-01-01T00:00:00Z",
};
const request = new Request("http://localhost/clientes?activo=true");
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});
describe("guards", () => {
  it.each(["https://other.test", "//other.test", "/\\other.test", "/\n/other.test", null])(
    "rejects an unsafe next %s",
    (value) => {
      expect(sanitizeNext(value)).toBe("/");
    },
  );
  it("preserves internal destinations", () => {
    expect(sanitizeNext("/clientes?activo=true")).toBe("/clientes?activo=true");
  });
  it("redirects unauthenticated visitors with a safe next", async () => {
    const response = (await requireUser(request).catch((error: unknown) => error)) as Response;
    const location = new URL(response.headers.get("Location")!, "http://localhost");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/clientes?activo=true");
  });
  it("requires changing temporary passwords", async () => {
    setTokens({ access: "a", refresh: "r" });
    setCachedUser({ ...user, must_change_password: true });
    const response = (await requireUser(request).catch((error: unknown) => error)) as Response;
    expect(response.headers.get("Location")).toBe("/cambiar-contrasena");
  });
  it("uses cached users and enforces the admin role", async () => {
    setTokens({ access: "a", refresh: "r" });
    setCachedUser(user);
    await expect(requireUser(request)).resolves.toBe(user);
    await expect(requireAdmin(request)).rejects.toMatchObject({
      data: "Solo el administrador puede ver esta página.",
      init: { status: 403 },
    });
  });
  it("loads the profile when no cached user exists", async () => {
    setTokens({ access: "a", refresh: "r" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(user))));
    await expect(requireUser(request)).resolves.toEqual(user);
  });
  it("redirects signed-in visitors away from login", async () => {
    setTokens({ access: "a", refresh: "r" });
    setCachedUser(user);
    const response = (await redirectIfAuthenticated().catch((error: unknown) => error)) as Response;
    expect(response.headers.get("Location")).toBe("/");
  });
});
