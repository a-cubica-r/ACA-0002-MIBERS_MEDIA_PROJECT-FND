import { redirect } from "react-router";
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "../auth/session";
import { ApiError, type ApiErrorPayload } from "./errors";
import type { Tokens } from "./types";

const API_BASE = `${(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")}/api/v1`;
export type ApiFetchInit = RequestInit & { json?: unknown; formData?: FormData; auth?: boolean };
let refreshPromise: Promise<void> | null = null;

function endSession(code: string): never {
  clearSession();
  const next =
    typeof window === "undefined"
      ? "/"
      : window.location.pathname + window.location.search + window.location.hash;
  throw redirect(
    `/login?${new URLSearchParams({ motivo: code === "session_expired" ? "inactividad" : "cerrada", next })}`,
  );
}
async function payload(response: Response): Promise<ApiErrorPayload> {
  try {
    const value: unknown = await response.json();
    return value && typeof value === "object" ? (value as ApiErrorPayload) : {};
  } catch {
    return {};
  }
}
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(0);
  }
}
async function refresh(): Promise<void> {
  const token = getRefreshToken();
  if (!token) endSession("invalid_token");
  let response: Response;
  try {
    response = await send(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: token }),
    });
  } catch {
    endSession("invalid_token");
  }
  if (!response.ok) endSession((await payload(response)).code ?? "invalid_token");
  let tokens: Tokens;
  try {
    tokens = (await response.json()) as Tokens;
  } catch {
    endSession("invalid_token");
  }
  if (
    !tokens ||
    typeof tokens.access !== "string" ||
    !tokens.access ||
    typeof tokens.refresh !== "string" ||
    !tokens.refresh
  )
    endSession("invalid_token");
  // A logout while refresh was pending must not recreate the session.
  if (getRefreshToken() !== token) endSession("session_revoked");
  setTokens(tokens);
}
async function request(path: string, options: ApiFetchInit = {}): Promise<Response> {
  const { json, formData, auth = true, ...init } = options;
  const access = auth ? getAccessToken() : null;
  const headers = new Headers(init.headers);
  if (auth && access) headers.set("Authorization", `Bearer ${access}`);
  if (formData) headers.delete("Content-Type");
  else if (json !== undefined) headers.set("Content-Type", "application/json");
  const body = formData ?? (json !== undefined ? JSON.stringify(json) : init.body);
  const url = `${API_BASE}/${path.replace(/^\//, "")}`;
  let response = await send(url, { ...init, headers, body });
  if (response.ok) return response;
  let error = await payload(response);
  if (auth && response.status === 401 && error.code !== "invalid_credentials") {
    if (["session_expired", "session_revoked", "invalid_token"].includes(error.code ?? ""))
      endSession(error.code!);
    if (getAccessToken() === access) {
      refreshPromise ??= refresh().finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
    }
    const newAccess = getAccessToken();
    if (!newAccess) endSession("session_revoked");
    headers.set("Authorization", `Bearer ${newAccess}`);
    response = await send(url, { ...init, headers, body });
    if (response.ok) return response;
    error = await payload(response);
    if (response.status === 401) endSession(error.code ?? "invalid_token");
  }
  if (response.status === 403 && error.code === "password_change_required")
    throw redirect("/cambiar-contrasena");
  throw new ApiError(response.status, error);
}
export async function apiFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const response = await request(path, init);
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}
export async function apiDownload(path: string): Promise<{ blob: Blob; filename: string }> {
  const response = await request(path);
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const plain = /filename="([^"]+)"|filename=([^;]+)/i.exec(disposition);
  let filename = plain?.[1] ?? plain?.[2]?.trim() ?? "manual-marca";
  if (encoded) {
    try {
      filename = decodeURIComponent(encoded);
    } catch {
      /* Keep the plain fallback. */
    }
  }
  filename = filename.split(/[\\/]/).pop() || "manual-marca";
  return { blob: await response.blob(), filename };
}
