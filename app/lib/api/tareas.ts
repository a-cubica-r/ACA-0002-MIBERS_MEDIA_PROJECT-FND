import { z } from "zod";
import { mockDelay, mockId, mutateStore, readStore } from "../mock/store";
import { fullName } from "../format";
import { ApiError } from "./errors";
import { listUsuarios } from "./usuarios";
import type { Cliente, Usuario } from "./types";

export const ESTADOS = ["PENDIENTE", "EN_PROGRESO", "EN_REVISION", "COMPLETADA"] as const;
export type EstadoTarea = (typeof ESTADOS)[number];
export const ESTADO_LABEL: Record<EstadoTarea, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  EN_REVISION: "En revisión",
  COMPLETADA: "Completada",
};
export interface Persona {
  id: string;
  nombre: string;
}
export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  cliente_id: string;
  pieza_id: string | null;
  asignado_a: Persona;
  creado_por: Persona;
  fecha_limite: string;
  prioridad: "BAJA" | "MEDIA" | "ALTA";
  estado: EstadoTarea;
  created_at: string;
  completada_at: string | null;
}
export type TareaInput = Pick<
  Tarea,
  | "titulo"
  | "descripcion"
  | "cliente_id"
  | "pieza_id"
  | "asignado_a"
  | "fecha_limite"
  | "prioridad"
  | "estado"
>;
const schema = z.object({
  titulo: z.string().trim().min(1).max(200),
  descripcion: z.string().max(5000),
  cliente_id: z.string().min(1),
  pieza_id: z.string().nullable(),
  asignado_a: z.object({ id: z.string().min(1), nombre: z.string().min(1) }),
  fecha_limite: z.iso.date(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA"]),
  estado: z.enum(ESTADOS),
});
const person = (user: Usuario): Persona => ({ id: user.id, nombre: fullName(user) });
export async function initializeTareas(user: Usuario, clientes: Cliente[]): Promise<void> {
  mutateStore((store) => {
    store.personas = [...store.personas.filter((p) => p.id !== user.id), person(user)].sort(
      (a, b) => a.id.localeCompare(b.id),
    );
  });
  const usuarios = user.role === "ADMIN" ? await listUsuarios({ isActive: true }) : [user];
  mutateStore((store) => {
    for (const usuario of [...usuarios, user]) {
      const value = person(usuario);
      store.personas = [...store.personas.filter((p) => p.id !== value.id), value];
    }
    store.personas.sort((a, b) => a.id.localeCompare(b.id));
    if (!store.tareasSembradas && clientes.length) {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
      store.tareas.push({
        id: mockId(),
        titulo: "Preparar propuesta de contenido",
        descripcion: "Revisar el objetivo del cliente y proponer las próximas publicaciones.",
        cliente_id: clientes[0].id,
        pieza_id: null,
        asignado_a: person(user),
        creado_por: person(user),
        fecha_limite: tomorrow,
        prioridad: "MEDIA",
        estado: "PENDIENTE",
        created_at: now.toISOString(),
        completada_at: null,
      });
      store.tareasSembradas = true;
    }
  });
}
export async function listPersonas(): Promise<Persona[]> {
  await mockDelay();
  return readStore().personas;
}
export async function listTareas(): Promise<Tarea[]> {
  await mockDelay();
  return readStore().tareas;
}
function validated(input: TareaInput): TareaInput {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new ApiError(400, {
      detail: "Revisa el título, la persona, el cliente y la fecha de la tarea.",
    });
  if (!readStore().personas.some((p) => p.id === input.asignado_a.id))
    throw new ApiError(400, { detail: "La persona seleccionada no está en el directorio." });
  return result.data;
}
export async function createTarea(input: TareaInput, user: Usuario): Promise<Tarea> {
  await mockDelay();
  const value = validated(input);
  const now = new Date().toISOString();
  const tarea: Tarea = {
    ...value,
    id: mockId(),
    creado_por: person(user),
    created_at: now,
    completada_at: value.estado === "COMPLETADA" ? now : null,
  };
  mutateStore((store) => {
    store.tareas.push(tarea);
  });
  return tarea;
}
export async function updateTarea(
  id: string,
  input: Partial<TareaInput>,
  user: Usuario,
): Promise<Tarea> {
  await mockDelay();
  const old = readStore().tareas.find((t) => t.id === id);
  if (!old) throw new ApiError(404, { detail: "Tarea no encontrada." });
  if (
    user.role !== "ADMIN" &&
    (old.asignado_a.id !== user.id || (input.asignado_a && input.asignado_a.id !== user.id))
  )
    throw new ApiError(403, { detail: "Solo puedes actualizar las tareas asignadas a ti." });
  const value = validated({ ...old, ...input });
  const tarea = {
    ...old,
    ...value,
    completada_at:
      value.estado === "COMPLETADA" ? (old.completada_at ?? new Date().toISOString()) : null,
  };
  mutateStore((store) => {
    store.tareas = store.tareas.map((t) => (t.id === id ? tarea : t));
  });
  return tarea;
}
