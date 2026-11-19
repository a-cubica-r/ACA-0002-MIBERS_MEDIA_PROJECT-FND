import { Form, redirect, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { login } from "~/lib/api/auth";
import { redirectIfAuthenticated, sanitizeNext } from "~/lib/auth/guards";
import { parseForm } from "~/lib/validation";
import { loginSchema } from "~/features/usuarios/schemas";
import { ActionFeedback, apiFailure } from "~/features/usuarios/action-feedback";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardBody } from "~/components/ui/card";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export const meta: Route.MetaFunction = () => [{ title: "Iniciar sesión · Mibers" }];
export async function clientLoader() {
  await redirectIfAuthenticated();
  return null;
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const parsed = parseForm(loginSchema, form);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  try {
    const result = await login(parsed.data);
    return redirect(
      result.user.must_change_password
        ? "/cambiar-contrasena"
        : sanitizeNext(new URL(request.url).searchParams.get("next")),
    );
  } catch (error) {
    return apiFailure(error);
  }
}
export default function Login({ actionData }: Route.ComponentProps) {
  const [params] = useSearchParams();
  const navigation = useNavigation();
  const reason = params.get("motivo");
  return (
    <main className="bg-canvas flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-brand-700 text-2xl font-bold">Mibers Creativos</p>
          <p className="text-ink-muted mt-2 text-sm">Tu equipo, conectado.</p>
        </div>
        <Card>
          <CardBody>
            <h1 className="text-ink mb-2 text-xl font-semibold">Iniciar sesión</h1>
            <p className="text-ink-muted mb-6 text-sm">
              Ingresa con el usuario asignado por tu administrador.
            </p>
            <Form method="post" className="space-y-5" noValidate>
              {reason === "inactividad" && (
                <Alert>Tu sesión se cerró tras 30 minutos de inactividad.</Alert>
              )}
              {reason === "cerrada" && (
                <Alert>Tu sesión se cerró. Ingresa de nuevo para continuar.</Alert>
              )}
              <ActionFeedback result={actionData} />
              <Field
                htmlFor="username"
                label="Usuario"
                required
                error={actionData?.fieldErrors?.username}
              >
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  invalid={!!actionData?.fieldErrors?.username}
                  aria-describedby={
                    actionData?.fieldErrors?.username ? "username-error" : undefined
                  }
                />
              </Field>
              <Field
                htmlFor="password"
                label="Contraseña"
                required
                error={actionData?.fieldErrors?.password}
              >
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  invalid={!!actionData?.fieldErrors?.password}
                  aria-describedby={
                    actionData?.fieldErrors?.password ? "password-error" : undefined
                  }
                />
              </Field>
              <Button type="submit" className="w-full" loading={navigation.state === "submitting"}>
                Ingresar
              </Button>
            </Form>
            <p className="text-ink-muted mt-6 text-center text-sm">
              ¿Olvidaste tu contraseña? Pídele al administrador que la restablezca.
            </p>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
