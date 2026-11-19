import type { Tokens, Usuario } from "../api/types";

const STORAGE_KEY = "mibers.session";
let fallback: Tokens | null = null;
let cachedUser: Usuario | null = null;
let storageFailed = false;

function readTokens(): Tokens | null {
  if (storageFailed) return fallback;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "access" in value &&
      "refresh" in value &&
      typeof value.access === "string" &&
      typeof value.refresh === "string"
    )
      return value as Tokens;
  } catch {
    storageFailed = true;
  }
  return fallback;
}
export function getAccessToken(): string | null {
  return readTokens()?.access ?? null;
}
export function getRefreshToken(): string | null {
  return readTokens()?.refresh ?? null;
}
export function setTokens(tokens: Tokens): void {
  fallback = tokens;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    storageFailed = true;
  }
}
export function clearSession(): void {
  fallback = null;
  cachedUser = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    storageFailed = true;
  }
}
export function getCachedUser(): Usuario | null {
  return cachedUser;
}
export function setCachedUser(user: Usuario | null): void {
  cachedUser = user;
}
