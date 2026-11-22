export type Role = "ADMIN" | "STAFF";
export interface Usuario {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  cargo: string;
  whatsapp_number: string | null;
  is_active: boolean;
  must_change_password: boolean;
  last_login: string | null;
  date_joined: string;
}
export type Estrategia = "VIRALIZAR" | "POSICIONAR" | "VENDER";
export type Red = "INSTAGRAM" | "FACEBOOK";
export type EstadoCuenta = "VINCULADA" | "EXPIRADA" | "DESVINCULADA";
export interface Contacto {
  id: string;
  cliente: string;
  nombre: string;
  numero: string;
  autorizado: boolean;
  autorizacion_at: string | null;
  autorizacion_evidencia: string;
}
export interface CuentaSocial {
  id: string;
  cliente: string;
  red: Red;
  handle: string;
  url_perfil: string;
  id_externo: string;
  estado: EstadoCuenta;
  estado_actualizado_at: string;
}
export interface Cliente {
  id: string;
  nombre: string;
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string;
  posts_por_semana: number;
  contrato_inicio: string;
  contrato_fin: string | null;
  estrategia: Estrategia;
  objetivo: string;
  tiene_manual_marca: boolean;
  manual_marca_nombre: string;
  activo: boolean;
  desactivado_at: string | null;
  contactos_whatsapp: Contacto[];
  cuentas: CuentaSocial[];
  created_at: string;
}
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
export type EstadoPieza =
  | "BORRADOR"
  | "EN_REVISION"
  | "CAMBIOS_SOLICITADOS"
  | "APROBADA"
  | "PROGRAMADA"
  | "PUBLICADA"
  | "FALLIDA"
  | "COMPARTIDA";
export type TipoPieza = "POST" | "CARRUSEL" | "REEL" | "HISTORIA" | "PORTADA";
export interface PiezaResumen {
  id: string;
  cliente: string;
  cliente_nombre: string;
  titulo: string;
  tipo: TipoPieza;
  estado: EstadoPieza;
  programada_para: string | null;
  redes: Red[];
  archivos_count: number;
  responsable: string | null;
  responsable_username: string;
}
export type EstadoEnvio = "PENDIENTE" | "ENVIADO" | "ENTREGADO" | "LEIDO" | "FALLIDO";
/** Envío de una pieza al cliente por WhatsApp (HU-19, RF18). `numero` llega enmascarado. */
export interface Envio {
  id: string;
  pieza: { id: string; titulo: string; tipo: TipoPieza };
  cliente: { id: string; nombre: string };
  contacto: { id: string; nombre: string };
  numero: string;
  archivo: { id: string; nombre: string; kind: "image" | "video" } | null;
  estado: EstadoEnvio;
  error: string;
  enviado_at: string | null;
  entregado_at: string | null;
  created_at: string;
}
export interface EmpresaActual {
  cliente: Cliente;
  proximas_publicaciones: PiezaResumen[];
  pendientes: {
    borradores: number;
    en_revision: number;
    cambios_solicitados: number;
    aprobadas_sin_programar: number;
    fallidas: number;
  };
  semana_actual: { plan: number; programadas: number };
}
export interface Tokens {
  access: string;
  refresh: string;
}
export interface LoginInput {
  username: string;
  password: string;
}
export interface LoginResponse extends Tokens {
  user: Usuario;
}
export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}
export interface UsuarioCreateInput {
  username: string;
  first_name?: string;
  last_name?: string;
  role?: Role;
  cargo?: string;
  whatsapp_number?: string | null;
}
export type UsuarioUpdateInput = Partial<Omit<UsuarioCreateInput, "username">>;
export type UsuarioCreateResponse = Usuario & { temporary_password: string };
export interface ClienteInput {
  nombre: string;
  contacto_nombre?: string;
  contacto_telefono?: string;
  contacto_email?: string;
  posts_por_semana: number;
  contrato_inicio: string;
  contrato_fin?: string | null;
  estrategia: Estrategia;
  objetivo?: string;
  manual_marca?: File;
}
export type ClienteUpdateInput = Partial<ClienteInput>;
export interface ContactoInput {
  nombre: string;
  numero: string;
  autorizado: boolean;
  evidencia?: string;
}
export type ContactoUpdateInput = Partial<ContactoInput>;
export interface CuentaInput {
  red: Red;
  handle: string;
  url_perfil: string;
  id_externo?: string;
}
export type CuentaUpdateInput = Partial<Omit<CuentaInput, "red">> & { estado?: EstadoCuenta };
