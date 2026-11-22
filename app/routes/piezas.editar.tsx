import { redirect } from "react-router";
import type { Route } from "./+types/piezas.editar";
import { getPieza, updatePieza, type PiezaInput } from "~/lib/api/piezas";
import { ApiError } from "~/lib/api/errors";
import { requireUser } from "~/lib/auth/guards";
import { parseForm } from "~/lib/validation";
import { piezaSchema } from "~/features/piezas/schemas";
import { loadFormOptions } from "~/features/piezas/form-data";
import { PiezaForm } from "~/features/piezas/pieza-form";
import { PageHeader } from "~/components/ui";
export const meta = () => [{ title: "Editar pieza · Mibers" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  const user = await requireUser(request);
  const [options, pieza] = await Promise.all([loadFormOptions(user), getPieza(params.piezaId)]);
  if (["PUBLICADA", "COMPARTIDA"].includes(pieza.estado))
    throw redirect(`/piezas/${params.piezaId}`);
  return { ...options, pieza };
}
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  await requireUser(request);
  const parsed = parseForm(piezaSchema, await request.formData());
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const input: PiezaInput = { ...parsed.data };
    delete input.cliente;
    await updatePieza(params.piezaId, input);
    return redirect(`/piezas/${params.piezaId}`);
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}
export default function Editar({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <PageHeader title="Editar pieza" />
      <PiezaForm {...loaderData} result={actionData} />
    </div>
  );
}
