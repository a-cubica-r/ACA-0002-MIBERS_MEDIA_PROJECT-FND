import { listClientes } from "~/lib/api/clientes";
import { listUsuarios } from "~/lib/api/usuarios";
import type { Cliente, Usuario } from "~/lib/api/types";
export async function loadClientes() {
  const clientes: Cliente[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    const result = await listClientes({ page, pageSize: 100 });
    clientes.push(...result.results);
    hasNext = Boolean(result.next);
    page++;
  }
  return clientes;
}
export async function loadFormOptions(user: Usuario) {
  const clientes = await loadClientes();
  const usuarios = user.role === "ADMIN" ? await listUsuarios({ isActive: true }) : [];
  return { clientes, usuarios };
}
