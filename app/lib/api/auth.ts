import { clearSession, getRefreshToken, setCachedUser, setTokens } from "../auth/session";
import { apiFetch } from "./client";
import type { ChangePasswordInput, LoginInput, LoginResponse, Usuario } from "./types";

export async function login(input: LoginInput): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>("auth/login", {
    method: "POST",
    json: input,
    auth: false,
  });
  setTokens(result);
  setCachedUser(result.user);
  return result;
}
export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) await apiFetch("auth/logout", { method: "POST", json: { refresh } });
  } catch {
    /* Logout always closes the local session, including when offline. */
  } finally {
    clearSession();
  }
}
export async function me(): Promise<Usuario> {
  const user = await apiFetch<Usuario>("auth/me");
  setCachedUser(user);
  return user;
}
export async function changePassword(input: ChangePasswordInput): Promise<{ detail: string }> {
  const result = await apiFetch<{ detail: string }>("auth/change-password", {
    method: "POST",
    json: input,
  });
  setCachedUser(null);
  return result;
}
