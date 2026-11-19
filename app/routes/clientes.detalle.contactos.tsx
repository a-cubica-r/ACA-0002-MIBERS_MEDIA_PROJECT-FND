import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/clientes.detalle.contactos";
import { createContacto, deleteContacto, listContactos, updateContacto } from "~/lib/api/clientes";
import { ApiError } from "~/lib/api/errors";
import type { Contacto } from "~/lib/api/types";
import { requireUser } from "~/lib/auth/guards";
import { formatDateTime } from "~/lib/format";
import { parseForm } from "~/lib/validation";
import { contactoSchema } from "~/features/clientes/schemas";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
} from "~/components/ui";
export const meta = () => [{ title: "Contactos WhatsApp · Mibers" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  await requireUser(request);
  return { contactos: await listContactos(params.clienteId) };
}
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  await requireUser(request);
  const form = await request.formData();
  const submissionId = String(form.get("submissionId") ?? "");
  const intent = form.get("intent");
  const id = String(form.get("id") ?? "");
  if (intent !== "create" && intent !== "update" && intent !== "delete")
    return { ok: false, error: "Acción inválida.", submissionId };
  if (intent !== "create" && !id)
    return { ok: false, error: "Selecciona un contacto.", submissionId };
  try {
    if (intent === "delete") await deleteContacto(params.clienteId, id);
    else {
      const parsed = parseForm(contactoSchema, form);
      if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors, submissionId };
      if (intent === "create") await createContacto(params.clienteId, parsed.data);
      else await updateContacto(params.clienteId, id, parsed.data);
    }
    return { ok: true, submissionId };
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors, submissionId };
    throw error;
  }
}
export default function ContactosCliente() {
  const { contactos } = useLoaderData<typeof clientLoader>();
  const fetcher = useFetcher<typeof clientAction>();
  const [editor, setEditor] = useState<{ contacto?: Contacto; submissionId: string } | null>(null);
  const [deleting, setDeleting] = useState<Contacto | null>(null);
  const result = fetcher.data?.submissionId === editor?.submissionId ? fetcher.data : undefined;
  const errors = result?.fieldErrors ?? {};
  const busy = fetcher.state !== "idle";
  function open(contacto?: Contacto) {
    setEditor({ contacto, submissionId: crypto.randomUUID() });
  }
  return (
    <div className="space-y-5">
      <PageHeader
        title="Contactos WhatsApp"
        actions={<Button onClick={() => open()}>Agregar contacto</Button>}
      />
      <Alert>Solo los contactos autorizados reciben el contenido por WhatsApp.</Alert>
      {fetcher.data?.error && !editor && <Alert tone="danger">{fetcher.data.error}</Alert>}
      {contactos.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {contactos.map((contacto) => (
            <Card key={contacto.id}>
              <CardBody className="space-y-3">
                <p className="font-semibold break-words">{contacto.nombre}</p>
                <p className="text-ink-muted text-sm">{contacto.numero}</p>
                <div>
                  <Badge tone={contacto.autorizado ? "success" : "warning"}>
                    {contacto.autorizado ? "Autorizado" : "Sin autorización"}
                  </Badge>
                  {contacto.autorizado && contacto.autorizacion_at && (
                    <p className="text-ink-muted mt-1 text-xs">
                      Desde el {formatDateTime(contacto.autorizacion_at)}
                    </p>
                  )}
                </div>
                {contacto.autorizacion_evidencia && (
                  <p className="text-ink-muted text-sm break-words">
                    Evidencia: {contacto.autorizacion_evidencia}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => open(contacto)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(contacto)}>
                    Eliminar
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin contactos WhatsApp"
          description="Registra los contactos y su autorización."
          action={<Button onClick={() => open()}>Agregar contacto</Button>}
        />
      )}
      <Modal
        open={!!editor && !(result?.ok && !busy)}
        onClose={() => setEditor(null)}
        title={editor?.contacto ? "Editar contacto" : "Agregar contacto"}
      >
        {editor && (
          <fetcher.Form key={editor.submissionId} method="post" className="space-y-4">
            <input type="hidden" name="submissionId" value={editor.submissionId} />
            <input type="hidden" name="intent" value={editor.contacto ? "update" : "create"} />
            <input type="hidden" name="id" value={editor.contacto?.id ?? ""} />
            {result?.error && <Alert tone="danger">{result.error}</Alert>}
            <Field label="Nombre" htmlFor="contacto-nombre" required error={errors.nombre}>
              <Input
                id="contacto-nombre"
                name="nombre"
                required
                defaultValue={editor.contacto?.nombre}
                aria-invalid={!!errors.nombre}
              />
            </Field>
            <Field
              label="Número WhatsApp"
              htmlFor="numero"
              required
              error={errors.numero}
              hint="Formato internacional, por ejemplo +573001112233."
            >
              <Input
                id="numero"
                name="numero"
                type="tel"
                required
                defaultValue={editor.contacto?.numero}
                aria-invalid={!!errors.numero}
              />
            </Field>
            <Checkbox
              name="autorizado"
              label="El titular autorizó el tratamiento de sus datos (Ley 1581 de 2012)"
              defaultChecked={editor.contacto?.autorizado}
            />
            <Field
              label="Evidencia de autorización (opcional)"
              htmlFor="evidencia"
              error={errors.evidencia}
              hint="Ej.: mensaje de WhatsApp del 3 de septiembre"
            >
              <Input
                id="evidencia"
                name="evidencia"
                defaultValue={editor.contacto?.autorizacion_evidencia}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditor(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button type="submit" loading={busy}>
                Guardar contacto
              </Button>
            </div>
          </fetcher.Form>
        )}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) fetcher.submit({ intent: "delete", id: deleting.id }, { method: "post" });
          setDeleting(null);
          setEditor(null);
        }}
        title="Eliminar contacto"
        description={`¿Eliminar a ${deleting?.nombre ?? "este contacto"} de los contactos WhatsApp?`}
        confirmLabel="Eliminar"
        tone="danger"
      />
    </div>
  );
}
