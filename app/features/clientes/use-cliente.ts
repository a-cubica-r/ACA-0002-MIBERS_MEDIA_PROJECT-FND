import { useRouteLoaderData } from "react-router";
import type { Cliente } from "~/lib/api/types";
export function useCliente(): Cliente {
  const result = useRouteLoaderData("routes/clientes.detalle") as { cliente: Cliente } | undefined;
  if (!result) throw new Error("El cliente debe leerse dentro de su página de detalle.");
  return result.cliente;
}
