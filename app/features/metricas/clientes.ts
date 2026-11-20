import { listClientes } from "~/lib/api/clientes";
import type { Cliente } from "~/lib/api/types";
export async function metricasClientes(query: URLSearchParams) {
  const clientes: Cliente[] = [];
  let page = 1;
  while (true) {
    const response = await listClientes({ activo: true, page, pageSize: 100 });
    clientes.push(...response.results);
    if (!response.next) break;
    page += 1;
  }
  const cliente =
    clientes.find((item) => item.id === query.get("cliente"))?.id ?? clientes[0]?.id ?? "";
  return { clientes, cliente };
}
