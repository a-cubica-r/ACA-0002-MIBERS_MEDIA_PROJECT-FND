import type {
  EstadoCuenta,
  EstadoEnvio,
  EstadoPieza,
  Estrategia,
  Red,
  Role,
  TipoPieza,
  Usuario,
} from "./api/types";
const options = { timeZone: "America/Bogota" };
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    ...options,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
export function formatDate(iso: string): string {
  const pure = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return new Intl.DateTimeFormat("es-CO", {
    ...options,
    ...(pure ? { timeZone: "UTC" } : {}),
    dateStyle: "medium",
  }).format(new Date(iso));
}
export const ESTRATEGIA_LABEL: Record<Estrategia, string> = {
  VIRALIZAR: "Viralizar",
  POSICIONAR: "Posicionar",
  VENDER: "Vender",
};
export const RED_LABEL: Record<Red, string> = { INSTAGRAM: "Instagram", FACEBOOK: "Facebook" };
export const ESTADO_CUENTA_LABEL: Record<EstadoCuenta, string> = {
  VINCULADA: "Vinculada",
  EXPIRADA: "Expirada",
  DESVINCULADA: "Desvinculada",
};
export const ROLE_LABEL: Record<Role, string> = { ADMIN: "Administrador", STAFF: "Personal" };
export const ESTADO_PIEZA_LABEL: Record<EstadoPieza, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  CAMBIOS_SOLICITADOS: "Cambios solicitados",
  APROBADA: "Aprobada",
  PROGRAMADA: "Programada",
  PUBLICADA: "Publicada",
  FALLIDA: "Fallida",
  COMPARTIDA: "Compartida",
};
export const ESTADO_ENVIO_LABEL: Record<EstadoEnvio, string> = {
  PENDIENTE: "Pendiente",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  LEIDO: "Leído",
  FALLIDO: "Fallido",
};
export const TIPO_PIEZA_LABEL: Record<TipoPieza, string> = {
  POST: "Post",
  CARRUSEL: "Carrusel",
  REEL: "Reel",
  HISTORIA: "Historia",
  PORTADA: "Portada",
};
export function fullName(user: Pick<Usuario, "first_name" | "last_name" | "username">): string {
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username;
}
