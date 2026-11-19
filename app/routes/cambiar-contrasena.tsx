import { Form, redirect } from "react-router";
import type { Route } from "./+types/cambiar-contrasena";
import { changePassword, logout, me } from "~/lib/api/auth";
import { getAccessToken, setCachedUser } from "~/lib/auth/session";
import { parseForm } from "~/lib/validation";
import { passwordSchema } from "~/features/usuarios/schemas";
import { apiFailure } from "~/features/usuarios/action-feedback";
import { PasswordForm } from "~/features/usuarios/password-form";
import { Card, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export const meta: Route.MetaFunction = () => [{ title: "Cambiar contraseña · Mibers" }];
export async function clientLoader() {
  if (!getAccessToken()) throw redirect("/login");
  const user = await me();
  if (!user.must_change_password) throw redirect("/");
  return { user };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  if (!getAccessToken()) throw redirect("/login");
  const form = await request.formData();
  if (form.get("intent") === "logout") {
    await logout();
    return redirect("/login");
  }
  const user = await me();
  const parsed = parseForm(passwordSchema, form);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    await changePassword(parsed.data);
    setCachedUser({ ...user, must_change_password: false });
    return redirect("/");
  } catch (error) {
    return apiFailure(error);
  }
}
export default function CambiarContrasena({ actionData }: Route.ComponentProps) {
  return (
    <main className="bg-canvas flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-5">
        <p className="text-brand-700 text-center text-xl font-bold">Mibers Creativos</p>
        <Card>
          <CardBody>
            <h1 className="text-ink text-xl font-semibold">Crea tu contraseña personal</h1>
            <p className="text-ink-muted mt-2 mb-6 text-sm">
              Para proteger tu cuenta, cambia la contraseña temporal antes de continuar.
            </p>
            <PasswordForm result={actionData} temporary />
          </CardBody>
        </Card>
        <Form method="post" className="text-center">
          <Button type="submit" name="intent" value="logout" variant="ghost">
            Cerrar sesión
          </Button>
        </Form>
      </div>
    </main>
  );
}
