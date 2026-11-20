import { apiFetch } from "./client";
import { isApiError } from "./errors";

export interface Politica {
  id: string;
  version: string;
  titulo: string;
  contenido: string;
  vigente_desde: string;
}

export interface PoliticaInput {
  version: string;
  titulo: string;
  contenido: string;
}

export async function getPoliticaVigente(): Promise<Politica | null> {
  try {
    return await apiFetch<Politica>("legal/politica", { auth: false });
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

export function listPoliticas(): Promise<Politica[]> {
  return apiFetch<Politica[]>("legal/politicas");
}

export function createPolitica(input: PoliticaInput): Promise<Politica> {
  return apiFetch<Politica>("legal/politicas", { method: "POST", json: input });
}
