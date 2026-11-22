import type { Persona, Tarea } from "../api/tareas";

export interface MockCollections {
  tareas: Tarea[];
  personas: Persona[];
  tareasSembradas: boolean;
}
const KEY = "mibers.mock.v1";
let memoryOnly = false;
let memory: MockCollections = { tareas: [], personas: [], tareasSembradas: false };
export const mockDelay = () => new Promise<void>((resolve) => setTimeout(resolve, 150));
export const mockId = () => crypto.randomUUID();
export function readStore(): MockCollections {
  if (memoryOnly) return structuredClone(memory);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const value = JSON.parse(raw) as MockCollections;
      if (
        Array.isArray(value.tareas) &&
        Array.isArray(value.personas) &&
        typeof value.tareasSembradas === "boolean"
      )
        memory = value;
    }
  } catch {
    memoryOnly = true;
  }
  return structuredClone(memory);
}
export function writeStore(value: MockCollections): void {
  memory = structuredClone(value);
  try {
    if (!memoryOnly) localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    memoryOnly = true;
  }
}
export function mutateStore(update: (store: MockCollections) => void): void {
  const store = readStore();
  const before = JSON.stringify(store);
  update(store);
  if (JSON.stringify(store) !== before) writeStore(store);
}
