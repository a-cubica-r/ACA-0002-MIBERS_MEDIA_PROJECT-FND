import { Link, useLocation, useNavigate } from "react-router";
import type { Route } from "./+types/usuarios.nuevo";
import { requireAdmin } from "~/lib/auth/guards";
import { createUsuario } from "~/lib/api/usuarios";
import { parseForm } from "~/lib/validation";
import { usuarioCreateSchema } from "~/features/usuarios/schemas";
import { apiFailure } from "~/features/usuarios/action-feedback";
import { UsuarioForm } from "~/features/usuarios/usuario-form";
import { TemporaryPasswordPanel } from "~/features/usuarios/temporary-password-panel";
import { Button, buttonClasses } from "~/components/ui/button";
import { Card, CardBody } from "~/components/ui/card";
import { PageHeader } from "~/components/ui/page-header";
import { Alert } from "~/components/ui/alert";

export const meta: Route.MetaFunction = () => [{ title: "Nuevo usuario · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAdmin(request);
  return null;
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireAdmin(request);
  const parsed = parseForm(usuarioCreateSchema, await request.formData());
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const user = await createUsuario(parsed.data);
    return { ok: true, user };
  } catch (error) {
    return apiFailure(error);
  }
}
export default function UsuariosNuevo({ actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const created = actionData && "user" in actionData ? actionData.user : undefined;
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={created ? "Usuario creado" : "Nuevo usuario"}
        description="Asigna un usuario y un rol para dar acceso al equipo."
      />
      <Card>
        <CardBody>
          {created ? (
            <div className="space-y-5">
              <Alert tone="success">Se creó el usuario {created.username} correctamente.</Alert>
              <TemporaryPasswordPanel password={created.temporary_password} />
              <div className="flex flex-wrap gap-3">
                <Link to="/usuarios" className={buttonClasses()}>
                  Ir a la lista
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => navigate(location.pathname, { replace: true })}
                >
                  Crear otro
                </Button>
              </div>
            </div>
          ) : (
            <UsuarioForm result={actionData} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
