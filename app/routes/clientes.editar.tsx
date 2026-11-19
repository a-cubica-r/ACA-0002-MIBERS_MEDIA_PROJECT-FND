import { redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/clientes.editar";
import { getCliente, updateCliente } from "~/lib/api/clientes";
import { ApiError } from "~/lib/api/errors";
import { requireUser } from "~/lib/auth/guards";
import { parseForm } from "~/lib/validation";
import { clienteSchema } from "~/features/clientes/schemas";
import { ClienteForm } from "~/features/clientes/cliente-form";
import { PageHeader } from "~/components/ui";
export const meta = () => [{ title: "Editar cliente · Mibers" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  await requireUser(request);
  return { cliente: await getCliente(params.clienteId) };
}
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  await requireUser(request);
  const parsed = parseForm(clienteSchema, await request.formData());
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    await updateCliente(params.clienteId, parsed.data);
    return redirect(`/clientes/${params.clienteId}`);
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}
export default function EditarCliente() {
  const { cliente } = useLoaderData<typeof clientLoader>();
  const result = useActionData<typeof clientAction>();
  return (
    <div className="space-y-6">
      <PageHeader title="Editar cliente" description={cliente.nombre} />
      <ClienteForm cliente={cliente} result={result} />
    </div>
  );
}
