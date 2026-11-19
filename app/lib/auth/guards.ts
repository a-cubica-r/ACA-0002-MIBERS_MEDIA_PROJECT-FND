import { data, redirect } from "react-router";
import { me } from "../api/auth";
import type { Usuario } from "../api/types";
import { getAccessToken, getCachedUser } from "./session";

export function sanitizeNext(next: string | null | undefined, fallback = "/"): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    Array.from(next).some(
      (character) =>
        character === "\\" || character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  )
    return fallback;
  return next;
}
export async function requireUser(request: Request): Promise<Usuario> {
  if (!getAccessToken()) {
    const url = new URL(request.url);
    throw redirect(
      `/login?${new URLSearchParams({ next: sanitizeNext(url.pathname + url.search + url.hash) })}`,
    );
  }
  const user = getCachedUser() ?? (await me());
  if (user.must_change_password) throw redirect("/cambiar-contrasena");
  return user;
}
export async function requireAdmin(request: Request): Promise<Usuario> {
  const user = await requireUser(request);
  if (user.role !== "ADMIN")
    throw data("Solo el administrador puede ver esta página.", { status: 403 });
  return user;
}
export async function redirectIfAuthenticated(): Promise<void> {
  if (!getAccessToken()) return;
  const user = getCachedUser() ?? (await me());
  throw redirect(user.must_change_password ? "/cambiar-contrasena" : "/");
}
