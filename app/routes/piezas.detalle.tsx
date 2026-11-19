import { redirect } from "react-router";
import type { Route } from "./+types/piezas.detalle";
import {
  deleteArchivo,
  deletePieza,
  getPieza,
  getProgramacion,
  listRevisiones,
  piezaTransition,
  reorderArchivos,
  uploadArchivo,
} from "~/lib/api/piezas";
import { ApiError } from "~/lib/api/errors";
import { requireAdmin, requireUser } from "~/lib/auth/guards";
import { PiezaDetail } from "~/features/piezas/pieza-detail";
export const meta = () => [{ title: "Detalle de pieza · Mibers" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const [pieza, revisiones] = await Promise.all([
    getPieza(params.piezaId),
    listRevisiones(params.piezaId),
  ]);
  return { pieza, revisiones };
}
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  await requireUser(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = params.piezaId;
  try {
    if (intent === "preview") return { ok: true, intent, preview: await getProgramacion(id) };
    if (intent === "eliminar") {
      await deletePieza(id);
      return redirect("/piezas");
    }
    if (intent === "subir" || intent === "editable") {
      const files = form
        .getAll("archivo")
        .filter((file): file is File => file instanceof File && file.size > 0);
      if (!files.length) return { ok: false, intent, error: "Selecciona al menos un archivo." };
      const errors: string[] = [];
      let uploaded = 0;
      for (const file of files) {
        try {
          await uploadArchivo(id, file, intent === "editable");
          uploaded++;
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
          errors.push(
            `${file.name}: ${error.message} ${Object.values(error.fieldErrors).join(" ")}`,
          );
        }
      }
      return {
        ok: errors.length === 0,
        intent,
        error: errors.join("\n") || undefined,
        message: `${uploaded} archivo(s) guardado(s).`,
      };
    }
    if (intent === "quitar-archivo") await deleteArchivo(id, String(form.get("archivoId")));
    else if (intent === "orden") await reorderArchivos(id, form.getAll("ids").map(String));
    else if (
      [
        "enviar-revision",
        "aprobar",
        "solicitar-cambios",
        "programar",
        "cancelar-programacion",
      ].includes(intent)
    ) {
      if (intent === "aprobar" || intent === "solicitar-cambios") await requireAdmin(request);
      const comentario = String(form.get("comentario") ?? "").trim();
      if (intent === "solicitar-cambios" && !comentario)
        return { ok: false, intent, error: "Indica qué cambios se necesitan." };
      if (intent === "programar" && form.get("confirmar") !== "true")
        return { ok: false, intent, error: "Revisa y confirma la programación." };
      await piezaTransition(id, intent as Parameters<typeof piezaTransition>[1], comentario);
    } else return { ok: false, intent, error: "Acción no válida." };
    return { ok: true, intent, message: "La pieza se actualizó correctamente." };
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, intent, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}
export default function Detalle({ loaderData }: Route.ComponentProps) {
  return <PiezaDetail {...loaderData} />;
}
