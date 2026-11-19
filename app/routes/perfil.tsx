import { redirect } from "react-router";
import type { Route } from "./+types/perfil";
import { changePassword, logout } from "~/lib/api/auth";
import { requireUser } from "~/lib/auth/guards";
import { setCachedUser } from "~/lib/auth/session";
import { parseForm } from "~/lib/validation";
import { fullName, ROLE_LABEL, formatDateTime } from "~/lib/format";
import { passwordSchema } from "~/features/usuarios/schemas";
import { apiFailure } from "~/features/usuarios/action-feedback";
import { PasswordForm } from "~/features/usuarios/password-form";
import { Card, CardBody, CardHeader } from "~/components/ui/card";
import { PageHeader } from "~/components/ui/page-header";

export const meta: Route.MetaFunction = () => [{ title: "Mi perfil · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  return { user: await requireUser(request) };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "logout") {
    await logout();
    return redirect("/login");
  }
  const user = await requireUser(request);
  const parsed = parseForm(passwordSchema, form);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    await changePassword(parsed.data);
    setCachedUser({ ...user, must_change_password: false });
    return { ok: true };
  } catch (error) {
    return apiFailure(error);
  }
}
export default function Perfil({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = loaderData;
  const details = [
    ["Nombre", fullName(user)],
    ["Usuario", user.username],
    ["Rol", ROLE_LABEL[user.role]],
    ["Cargo", user.cargo || "Sin cargo"],
    ["Último ingreso", user.last_login ? formatDateTime(user.last_login) : "Aún no ha ingresado"],
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi perfil"
        description="Consulta tus datos y cuida el acceso a tu cuenta."
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Datos personales" />
          <CardBody>
            <dl className="space-y-4">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-ink-muted text-xs">{label}</dt>
                  <dd className="text-ink mt-1 text-sm font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Cambiar contraseña" />
          <CardBody>
            <PasswordForm result={actionData} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
