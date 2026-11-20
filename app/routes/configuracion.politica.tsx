import { useEffect, useRef } from "react";
import { Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/configuracion.politica";
import { Alert } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button, buttonClasses } from "~/components/ui/button";
import { Card, CardBody, CardHeader } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { PageHeader } from "~/components/ui/page-header";
import { Textarea } from "~/components/ui/textarea";
import { createPolitica, listPoliticas } from "~/lib/api/legal";
import { isApiError } from "~/lib/api/errors";
import { requireAdmin } from "~/lib/auth/guards";
import { formatDate } from "~/lib/format";

interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export const meta: Route.MetaFunction = () => [{ title: "Política de datos · Mibers" }];

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAdmin(request);
  return { politicas: await listPoliticas() };
}

export async function clientAction({ request }: Route.ClientActionArgs): Promise<ActionResult> {
  await requireAdmin(request);
  const form = await request.formData();
  const version = String(form.get("version") ?? "").trim();
  const titulo = String(form.get("titulo") ?? "").trim();
  const contenido = String(form.get("contenido") ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (!version) fieldErrors.version = "Ingresa la versión.";
  if (!titulo) fieldErrors.titulo = "Ingresa el título.";
  if (!contenido) fieldErrors.contenido = "Escribe el contenido de la política.";
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  try {
    await createPolitica({ version, titulo, contenido });
    return { ok: true };
  } catch (error) {
    if (isApiError(error))
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}

export default function ConfiguracionPolitica({ loaderData, actionData }: Route.ComponentProps) {
  const { politicas } = loaderData;
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrors = actionData && !actionData.ok ? actionData.fieldErrors : undefined;

  useEffect(() => {
    if (actionData?.ok) formRef.current?.reset();
  }, [actionData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Política de tratamiento de datos"
        description="Ley 1581 de 2012: la versión más reciente es la que se muestra públicamente."
        actions={
          <Link
            to="/politica-de-datos"
            target="_blank"
            rel="noreferrer"
            className={buttonClasses({ variant: "secondary" })}
          >
            Ver página pública
          </Link>
        }
      />

      <Card>
        <CardHeader
          title="Publicar nueva versión"
          description="Al publicarla queda vigente de inmediato en la página pública."
        />
        <CardBody>
          <Form ref={formRef} method="post" className="space-y-5" noValidate>
            {actionData?.ok && <Alert tone="success">Versión publicada.</Alert>}
            {actionData && !actionData.ok && actionData.error && (
              <Alert tone="danger">{actionData.error}</Alert>
            )}

            <Field
              htmlFor="version"
              label="Versión"
              hint={'Por ejemplo, "1.1".'}
              error={fieldErrors?.version}
              required
            >
              <Input
                id="version"
                name="version"
                maxLength={20}
                autoComplete="off"
                required
                invalid={!!fieldErrors?.version}
                aria-describedby={fieldErrors?.version ? "version-error" : undefined}
              />
            </Field>

            <Field htmlFor="titulo" label="Título" error={fieldErrors?.titulo} required>
              <Input
                id="titulo"
                name="titulo"
                maxLength={200}
                required
                invalid={!!fieldErrors?.titulo}
                aria-describedby={fieldErrors?.titulo ? "titulo-error" : undefined}
              />
            </Field>

            <Field htmlFor="contenido" label="Contenido" error={fieldErrors?.contenido} required>
              <Textarea
                id="contenido"
                name="contenido"
                rows={12}
                required
                invalid={!!fieldErrors?.contenido}
                aria-describedby={fieldErrors?.contenido ? "contenido-error" : undefined}
              />
            </Field>

            <Button type="submit" loading={navigation.state === "submitting"}>
              Publicar versión
            </Button>
          </Form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Versiones publicadas"
          description="La primera de la lista es la que se muestra en la página pública."
        />
        <CardBody>
          {politicas.length === 0 ? (
            <EmptyState
              title="Aún no hay versiones publicadas"
              description="Cuando publiques la primera versión aparecerá aquí y en la página pública."
            />
          ) : (
            <ol className="divide-line divide-y">
              {politicas.map((politica, index) => (
                <li key={politica.id} className="py-4 first:pt-0 last:pb-0">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-ink text-sm font-semibold">
                        Versión {politica.version}
                      </span>
                      {index === 0 && <Badge tone="success">Vigente</Badge>}
                      <span className="text-ink-muted text-sm break-words">{politica.titulo}</span>
                      <span className="text-ink-subtle w-full text-xs sm:w-auto">
                        Vigente desde {formatDate(politica.vigente_desde)}
                      </span>
                    </summary>
                    <div className="text-ink mt-3 text-sm leading-relaxed whitespace-pre-line">
                      {politica.contenido}
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
