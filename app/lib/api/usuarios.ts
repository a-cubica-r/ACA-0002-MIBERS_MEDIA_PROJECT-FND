import { apiFetch } from "./client";
import type {
  Usuario,
  UsuarioCreateInput,
  UsuarioCreateResponse,
  UsuarioUpdateInput,
} from "./types";

export function listUsuarios({ isActive }: { isActive?: boolean } = {}): Promise<Usuario[]> {
  return apiFetch(`usuarios${isActive === undefined ? "" : `?is_active=${isActive}`}`);
}
export function getUsuario(id: string): Promise<Usuario> {
  return apiFetch(`usuarios/${encodeURIComponent(id)}`);
}
export function createUsuario(input: UsuarioCreateInput): Promise<UsuarioCreateResponse> {
  return apiFetch("usuarios", { method: "POST", json: input });
}
export function updateUsuario(id: string, input: UsuarioUpdateInput): Promise<Usuario> {
  return apiFetch(`usuarios/${encodeURIComponent(id)}`, { method: "PATCH", json: input });
}
export function desactivarUsuario(id: string): Promise<Usuario> {
  return apiFetch(`usuarios/${encodeURIComponent(id)}/desactivar`, { method: "POST" });
}
export function activarUsuario(id: string): Promise<Usuario> {
  return apiFetch(`usuarios/${encodeURIComponent(id)}/activar`, { method: "POST" });
}
export function restablecerPassword(id: string): Promise<{ temporary_password: string }> {
  return apiFetch(`usuarios/${encodeURIComponent(id)}/restablecer-password`, { method: "POST" });
}
