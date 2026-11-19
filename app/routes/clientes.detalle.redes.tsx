import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/clientes.detalle.redes";
import { createCuenta, listCuentas, updateCuenta } from "~/lib/api/clientes";
import { ApiError } from "~/lib/api/errors";
import type { CuentaSocial, Red } from "~/lib/api/types";
import { requireAdmin, requireUser } from "~/lib/auth/guards";
import { useIsAdmin } from "~/lib/auth/use-current-user";
import { ESTADO_CUENTA_LABEL, RED_LABEL, formatDateTime } from "~/lib/format";
import { parseForm } from "~/lib/validation";
import { cuentaSchema } from "~/features/clientes/schemas";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Modal,
  Select,
} from "~/components/ui";
export const meta = () => [{ title: "Redes sociales · Mibers" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  await requireUser(request);
  return { cuentas: await listCuentas(params.clienteId) };
}
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const submissionId = String(form.get("submissionId") ?? "");
  const intent = form.get("intent");
  if (intent !== "create" && intent !== "update")
    return { ok: false, error: "Acción inválida.", submissionId };
  const parsed = parseForm(cuentaSchema, form);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors, submissionId };
  const id = String(form.get("id") ?? "");
  if (intent === "update" && !id)
    return { ok: false, error: "Selecciona una cuenta.", submissionId };
  try {
    const { red, estado, ...input } = parsed.data;
    if (intent === "create") await createCuenta(params.clienteId, { red, ...input });
    else await updateCuenta(params.clienteId, id, { ...input, estado });
    return { ok: true, submissionId };
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors, submissionId };
    throw error;
  }
}
export default function RedesCliente() {
  const { cuentas } = useLoaderData<typeof clientLoader>();
  const admin = useIsAdmin();
  const fetcher = useFetcher<typeof clientAction>();
  const busy = fetcher.state !== "idle";
  const [editor, setEditor] = useState<{
    red: Red;
    cuenta?: CuentaSocial;
    submissionId: string;
  } | null>(null);
  const result = fetcher.data?.submissionId === editor?.submissionId ? fetcher.data : undefined;
  const errors = result?.fieldErrors ?? {};
  return (
    <div className="space-y-5">
      <Alert>
        Las cuentas se registran manualmente. Nunca se guardan contraseñas de Instagram o Facebook.
      </Alert>
      {!admin && (
        <p className="text-ink-muted text-sm">Solo el administrador gestiona las cuentas.</p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {(["INSTAGRAM", "FACEBOOK"] as const).map((red) => {
          const cuenta = cuentas.find((value) => value.red === red);
          return (
            <Card key={red}>
              <CardHeader
                title={RED_LABEL[red]}
                actions={
                  admin && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditor({ red, cuenta, submissionId: crypto.randomUUID() })}
                    >
                      {cuenta ? "Editar" : "Registrar cuenta"}
                    </Button>
                  )
                }
              />
              <CardBody>
                {cuenta ? (
                  <dl className="space-y-3 break-words">
                    <div>
                      <dt className="text-ink-muted text-sm">Usuario</dt>
                      <dd>{cuenta.handle}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted text-sm">Perfil</dt>
                      <dd>
                        {/^https?:\/\//i.test(cuenta.url_perfil) ? (
                          <a
                            className="text-brand-700 break-all hover:underline"
                            href={cuenta.url_perfil}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {cuenta.url_perfil}
                            <span className="sr-only"> (abre en otra pestaña)</span>
                          </a>
                        ) : (
                          "Sin enlace"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted text-sm">ID externo</dt>
                      <dd>{cuenta.id_externo || "Sin registrar"}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Estado</dt>
                      <dd>
                        <Badge
                          tone={
                            cuenta.estado === "VINCULADA"
                              ? "success"
                              : cuenta.estado === "EXPIRADA"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {ESTADO_CUENTA_LABEL[cuenta.estado]}
                        </Badge>
                        <p className="text-ink-muted mt-2 text-xs">
                          Actualizado el {formatDateTime(cuenta.estado_actualizado_at)}
                        </p>
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-ink-muted text-sm">Sin registrar</p>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
      <Modal
        open={!!editor && !(result?.ok && !busy)}
        onClose={() => setEditor(null)}
        title={`${editor?.cuenta ? "Editar" : "Registrar"} cuenta de ${editor ? RED_LABEL[editor.red] : "red social"}`}
      >
        {editor && (
          <fetcher.Form key={editor.submissionId} method="post" className="space-y-4">
            <input type="hidden" name="submissionId" value={editor.submissionId} />
            <input type="hidden" name="intent" value={editor.cuenta ? "update" : "create"} />
            <input type="hidden" name="id" value={editor.cuenta?.id ?? ""} />
            <input type="hidden" name="red" value={editor.red} />
            {result?.error && <Alert tone="danger">{result.error}</Alert>}
            <Field htmlFor="handle" label="Usuario de la cuenta" required error={errors.handle}>
              <Input
                id="handle"
                name="handle"
                required
                defaultValue={editor.cuenta?.handle}
                aria-invalid={!!errors.handle}
              />
            </Field>
            <Field htmlFor="url_perfil" label="Enlace al perfil" required error={errors.url_perfil}>
              <Input
                id="url_perfil"
                name="url_perfil"
                type="url"
                required
                defaultValue={editor.cuenta?.url_perfil}
                aria-invalid={!!errors.url_perfil}
              />
            </Field>
            <Field htmlFor="id_externo" label="ID externo (opcional)" error={errors.id_externo}>
              <Input id="id_externo" name="id_externo" defaultValue={editor.cuenta?.id_externo} />
            </Field>
            {editor.cuenta && (
              <Field htmlFor="estado" label="Estado" error={errors.estado}>
                <Select id="estado" name="estado" defaultValue={editor.cuenta.estado}>
                  {Object.entries(ESTADO_CUENTA_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditor(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button type="submit" loading={busy}>
                Guardar cuenta
              </Button>
            </div>
          </fetcher.Form>
        )}
      </Modal>
    </div>
  );
}
