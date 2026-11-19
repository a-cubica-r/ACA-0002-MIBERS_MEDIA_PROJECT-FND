import type { Route } from "./+types/usuarios.editar";
import { requireAdmin } from "~/lib/auth/guards";
import { setCachedUser } from "~/lib/auth/session";
import { getUsuario, updateUsuario } from "~/lib/api/usuarios";
import { parseForm } from "~/lib/validation";
import { fullName } from "~/lib/format";
import { usuarioUpdateSchema } from "~/features/usuarios/schemas";
import { apiFailure } from "~/features/usuarios/action-feedback";
import { UsuarioForm } from "~/features/usuarios/usuario-form";
import { UsuarioActions, mutateUsuario } from "~/features/usuarios/usuario-actions";
import { Card, CardBody, CardHeader } from "~/components/ui/card";
import { PageHeader } from "~/components/ui/page-header";

export const meta: Route.MetaFunction = () => [{ title: "Editar usuario · Mibers" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  const currentUser = await requireAdmin(request);
  return { currentUser, user: await getUsuario(params.usuarioId) };
}
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  const currentUser = await requireAdmin(request);
  const form = await request.formData();
  if (form.get("intent") !== "guardar") return mutateUsuario(form.get("intent"), params.usuarioId);
  const parsed = parseForm(usuarioUpdateSchema, form);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const user = await updateUsuario(params.usuarioId, parsed.data);
    if (user.id === currentUser.id) setCachedUser(user);
    return { ok: true };
  } catch (error) {
    return apiFailure(error);
  }
}
export default function UsuariosEditar({ loaderData, actionData }: Route.ComponentProps) {
  const { user, currentUser } = loaderData;
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Editar usuario" description={fullName(user)} />
      <Card>
        <CardBody>
          <UsuarioForm user={user} result={actionData} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Acceso a la cuenta"
          description="Cambia el estado de acceso o entrega una nueva contraseña temporal."
        />
        <CardBody>
          <UsuarioActions user={user} currentUserId={currentUser.id} />
        </CardBody>
      </Card>
    </div>
  );
}
