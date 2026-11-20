import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiDownload, apiFetch } from "./client";
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "../auth/session";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  clearSession();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
});
describe("apiFetch", () => {
  it("adds Bearer and serializes JSON", async () => {
    setTokens({ access: "access", refresh: "refresh" });
    fetchMock.mockResolvedValue(json({ id: "1" }));
    await expect(
      apiFetch("usuarios", { method: "POST", json: { nombre: "Ana" } }),
    ).resolves.toEqual({ id: "1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/usuarios");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer access");
    expect(init?.body).toBe('{"nombre":"Ana"}');
  });
  it("shares a single refresh between concurrent failures and rotates tokens", async () => {
    setTokens({ access: "old", refresh: "refresh-old" });
    let resolveRefresh!: (response: Response) => void;
    const refreshed = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    fetchMock.mockImplementation(async (url, init) => {
      if (String(url).endsWith("auth/refresh")) return refreshed;
      return new Headers(init?.headers).get("Authorization") === "Bearer old"
        ? json({ code: "token_not_valid" }, 401)
        : json({ ok: true });
    });
    const requests = [apiFetch("one"), apiFetch("two")];
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => String(url).endsWith("auth/refresh")),
      ).toHaveLength(1),
    );
    resolveRefresh(json({ access: "new", refresh: "refresh-new" }));
    await expect(Promise.all(requests)).resolves.toEqual([{ ok: true }, { ok: true }]);
    expect(getAccessToken()).toBe("new");
    expect(getRefreshToken()).toBe("refresh-new");
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(
      fetchMock.mock.calls.find(([url]) => String(url).endsWith("auth/refresh"))?.[1]?.body,
    ).toBe('{"refresh":"refresh-old"}');
  });
  it("clears expired sessions and preserves the current path", async () => {
    window.history.replaceState({}, "", "/clientes?activo=true");
    setTokens({ access: "a", refresh: "r" });
    fetchMock.mockResolvedValue(json({ code: "session_expired" }, 401));
    const response = (await apiFetch("clientes").catch((error: unknown) => error)) as Response;
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("Location")!, window.location.origin);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("motivo")).toBe("inactividad");
    expect(location.searchParams.get("next")).toBe("/clientes?activo=true");
    expect(getAccessToken()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("redirects to password change", async () => {
    fetchMock.mockResolvedValue(json({ code: "password_change_required" }, 403));
    const response = (await apiFetch("clientes").catch((error: unknown) => error)) as Response;
    expect(response.headers.get("Location")).toBe("/cambiar-contrasena");
  });
  it("lets the browser set the multipart boundary", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const formData = new FormData();
    formData.set("nombre", "Marca");
    await expect(
      apiFetch("clientes", {
        method: "POST",
        formData,
        headers: { "Content-Type": "application/json" },
      }),
    ).resolves.toBeUndefined();
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has("Content-Type")).toBe(false);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(formData);
  });
  it("keeps invalid login credentials as ApiError without refresh", async () => {
    fetchMock.mockResolvedValue(json({ code: "invalid_credentials", detail: "Error." }, 401));
    await expect(apiFetch("auth/login", { auth: false })).rejects.toMatchObject({
      code: "invalid_credentials",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("clears session if refresh fails", async () => {
    setTokens({ access: "a", refresh: "r" });
    fetchMock
      .mockResolvedValueOnce(json({ code: "token_not_valid" }, 401))
      .mockResolvedValueOnce(json({ code: "session_revoked" }, 401));
    const response = (await apiFetch("clientes").catch((error: unknown) => error)) as Response;
    expect(response.headers.get("Location")).toContain("motivo=cerrada");
    expect(getRefreshToken()).toBeNull();
  });
  it("normalizes network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await expect(apiFetch("clientes")).rejects.toMatchObject({ status: 0, code: "network_error" });
  });
  it("downloads a blob using the UTF-8 disposition filename", async () => {
    fetchMock.mockResolvedValue(
      new Response("manual", {
        headers: { "Content-Disposition": "attachment; filename*=UTF-8''Gu%C3%ADa.pdf" },
      }),
    );
    const result = await apiDownload("clientes/1/manual-marca");
    expect(result.filename).toBe("Guía.pdf");
    expect(await result.blob.text()).toBe("manual");
  });
});
