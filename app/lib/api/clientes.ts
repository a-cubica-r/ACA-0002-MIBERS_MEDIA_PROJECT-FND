import { apiDownload, apiFetch } from "./client";
import type {
  Cliente,
  ClienteInput,
  ClienteUpdateInput,
  Contacto,
  ContactoInput,
  ContactoUpdateInput,
  CuentaSocial,
  CuentaInput,
  CuentaUpdateInput,
  Estrategia,
  Paginated,
} from "./types";

const path = (id: string) => `clientes/${encodeURIComponent(id)}`;
export interface ClienteFilters {
  activo?: boolean;
  estrategia?: Estrategia;
  search?: string;
  page?: number;
  pageSize?: number;
}
export function listClientes(filters: ClienteFilters = {}): Promise<Paginated<Cliente>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "")
      query.set(key === "pageSize" ? "page_size" : key, String(value));
  }
  return apiFetch(`clientes${query.size ? `?${query}` : ""}`);
}
function body(input: ClienteUpdateInput) {
  if (input.manual_marca instanceof File) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(input)) {
      if (value !== null && value !== undefined)
        formData.append(key, value instanceof File ? value : String(value));
    }
    return { formData };
  }
  return { json: input };
}
export const getCliente = (id: string): Promise<Cliente> => apiFetch(path(id));
export const createCliente = (input: ClienteInput): Promise<Cliente> =>
  apiFetch("clientes", { method: "POST", ...body(input) });
export const updateCliente = (id: string, input: ClienteUpdateInput): Promise<Cliente> =>
  apiFetch(path(id), { method: "PATCH", ...body(input) });
export const desactivarCliente = (id: string): Promise<Cliente> =>
  apiFetch(`${path(id)}/desactivar`, { method: "POST" });
export const reactivarCliente = (id: string): Promise<Cliente> =>
  apiFetch(`${path(id)}/reactivar`, { method: "POST" });
export const descargarManualMarca = (id: string) => apiDownload(`${path(id)}/manual-marca`);
export const listContactos = (id: string): Promise<Contacto[]> => apiFetch(`${path(id)}/contactos`);
export const createContacto = (id: string, input: ContactoInput): Promise<Contacto> =>
  apiFetch(`${path(id)}/contactos`, { method: "POST", json: input });
export const updateContacto = (
  id: string,
  contactoId: string,
  input: ContactoUpdateInput,
): Promise<Contacto> =>
  apiFetch(`${path(id)}/contactos/${encodeURIComponent(contactoId)}`, {
    method: "PATCH",
    json: input,
  });
export const deleteContacto = (id: string, contactoId: string): Promise<void> =>
  apiFetch(`${path(id)}/contactos/${encodeURIComponent(contactoId)}`, { method: "DELETE" });
export const listCuentas = (id: string): Promise<CuentaSocial[]> => apiFetch(`${path(id)}/cuentas`);
export const createCuenta = (id: string, input: CuentaInput): Promise<CuentaSocial> =>
  apiFetch(`${path(id)}/cuentas`, { method: "POST", json: input });
export const updateCuenta = (
  id: string,
  cuentaId: string,
  input: CuentaUpdateInput,
): Promise<CuentaSocial> =>
  apiFetch(`${path(id)}/cuentas/${encodeURIComponent(cuentaId)}`, { method: "PATCH", json: input });
