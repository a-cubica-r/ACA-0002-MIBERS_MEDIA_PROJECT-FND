import { redirect } from "react-router";
import type { Route } from "./+types/piezas.nueva";
import { createPieza } from "~/lib/api/piezas";
import { ApiError } from "~/lib/api/errors";
import { requireUser } from "~/lib/auth/guards";
import { parseForm } from "~/lib/validation";
import { piezaSchema } from "~/features/piezas/schemas";
import { loadFormOptions } from "~/features/piezas/form-data";
import { PiezaForm } from "~/features/piezas/pieza-form";
import { PageHeader } from "~/components/ui";
export const meta = () => [{ title: "Nueva pieza · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireUser(request);
  return {
    ...(await loadFormOptions(user)),
    clienteId: new URL(request.url).searchParams.get("cliente") ?? "",
  };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireUser(request);
  const parsed = parseForm(piezaSchema, await request.formData());
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const pieza = await createPieza(parsed.data);
    return redirect(`/piezas/${pieza.id}`);
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}
export default function Nueva({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <PageHeader title="Nueva pieza" description="Prepara la ficha y luego agrega sus archivos." />
      <PiezaForm {...loaderData} result={actionData} />
    </div>
  );
}
