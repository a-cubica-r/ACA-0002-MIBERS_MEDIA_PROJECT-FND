import { redirect, useActionData } from "react-router";
import type { Route } from "./+types/clientes.nuevo";
import { createCliente } from "~/lib/api/clientes";
import { ApiError } from "~/lib/api/errors";
import { requireUser } from "~/lib/auth/guards";
import { parseForm } from "~/lib/validation";
import { clienteSchema } from "~/features/clientes/schemas";
import { ClienteForm } from "~/features/clientes/cliente-form";
import { PageHeader } from "~/components/ui";
export const meta = () => [{ title: "Nuevo cliente · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  return null;
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireUser(request);
  const parsed = parseForm(clienteSchema, await request.formData());
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const cliente = await createCliente(parsed.data);
    return redirect(`/clientes/${cliente.id}`);
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}
export default function NuevoCliente() {
  const result = useActionData<typeof clientAction>();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo cliente"
        description="Centraliza su información, contrato y estrategia."
      />
      <ClienteForm result={result} />
    </div>
  );
}
