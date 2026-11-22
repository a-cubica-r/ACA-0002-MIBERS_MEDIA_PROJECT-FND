import { listClientes } from "~/lib/api/clientes";
import { listPiezas } from "~/lib/api/piezas";
import type { Cliente, PiezaResumen } from "~/lib/api/types";
export async function clientesTareas(): Promise<Cliente[]> {
  const clientes: Cliente[] = [];
  for (let page = 1; ; page++) {
    const result = await listClientes({ page, pageSize: 100 });
    clientes.push(...result.results);
    if (!result.next) return clientes;
  }
}
export async function piezasTareas(cliente?: string): Promise<PiezaResumen[]> {
  const piezas: PiezaResumen[] = [];
  for (let page = 1; ; page++) {
    const result = await listPiezas({ cliente, page, page_size: 100 });
    piezas.push(...result.results);
    if (!result.next) return piezas;
  }
}
