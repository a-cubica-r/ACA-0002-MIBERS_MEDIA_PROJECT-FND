import { useState } from "react";
import { Link, useFetcher } from "react-router";
import type { clientAction } from "~/routes/piezas.detalle";
import type { Pieza, Revision } from "~/lib/api/piezas";
import { useIsAdmin } from "~/lib/auth/use-current-user";
import { ESTADO_CUENTA_LABEL, RED_LABEL, TIPO_PIEZA_LABEL, formatDateTime } from "~/lib/format";
import {
  Alert,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Textarea,
  buttonClasses,
} from "~/components/ui";
import { EstadoPiezaBadge } from "~/features/contenido/badges";
import { ArchivoPreview, EditableDownload } from "./archivo-preview";
export function PiezaDetail({ pieza: p, revisiones }: { pieza: Pieza; revisiones: Revision[] }) {
  const admin = useIsAdmin();
  const mutation = useFetcher<typeof clientAction>();
  const preview = useFetcher<typeof clientAction>();
  const [modal, setModal] = useState<"" | "cambios" | "programar" | "eliminar">("");
  const busy = mutation.state !== "idle";
  const editable = !["PUBLICADA", "COMPARTIDA"].includes(p.estado);
  const reviewed = ["APROBADA", "PROGRAMADA", "FALLIDA"].includes(p.estado);
  const scheduled = preview.data?.preview;
  const act = (intent: string) => mutation.submit({ intent }, { method: "post" });
  const done = mutation.state === "idle" && mutation.data?.ok;
  const changesOpen =
    modal === "cambios" && !(done && mutation.data?.intent === "solicitar-cambios");
  const scheduleOpen = modal === "programar" && !(done && mutation.data?.intent === "programar");
  return (
    <div className="space-y-6">
      <PageHeader
        title={p.titulo || "Pieza sin título"}
        description={`${p.cliente_nombre} · ${TIPO_PIEZA_LABEL[p.tipo]}`}
        actions={
          <Link to="/piezas" className={buttonClasses({ variant: "secondary" })}>
            Volver a piezas
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <EstadoPiezaBadge estado={p.estado} />
        {editable && (
          <Link className={buttonClasses({ variant: "secondary" })} to={`/piezas/${p.id}/editar`}>
            Editar
          </Link>
        )}
        {p.estado === "BORRADOR" && (
          <Button variant="danger" disabled={busy} onClick={() => setModal("eliminar")}>
            Eliminar
          </Button>
        )}
      </div>
      {mutation.data?.error && (
        <Alert tone="danger" className="whitespace-pre-wrap">
          {mutation.data.error}
          {mutation.data.fieldErrors && (
            <ul>
              {Object.entries(mutation.data.fieldErrors).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}
      {mutation.data?.message && (
        <Alert tone={mutation.data.ok ? "success" : "warning"}>{mutation.data.message}</Alert>
      )}
      <section className="border-line bg-surface space-y-4 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Ficha</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Cliente</dt>
            <dd>
              <Link className="text-brand-700 underline" to={`/clientes/${p.cliente}`}>
                {p.cliente_nombre}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Fecha y hora de Colombia</dt>
            <dd>{p.programada_para ? formatDateTime(p.programada_para) : "Sin fecha"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Responsable</dt>
            <dd>{p.responsable_username || "Sin asignar"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Campaña</dt>
            <dd>{p.campana || "Sin campaña"}</dd>
          </div>
        </dl>
        {p.redes.map((r) => (
          <div key={r.red}>
            <h3 className="font-medium">Copy final · {RED_LABEL[r.red]}</h3>
            <p className="break-words whitespace-pre-wrap">{r.copy_final || "Sin copy"}</p>
          </div>
        ))}
        <div>
          <h3 className="font-medium">Hashtags</h3>
          <p className="break-words">{p.hashtags.join(" ") || "Sin hashtags"}</p>
        </div>
        <div>
          <h3 className="font-medium">Enlaces</h3>
          {p.enlaces.length ? (
            <ul>
              {p.enlaces.map((url, i) => (
                <li key={i}>
                  <a
                    href={/^https?:\/\//i.test(url) ? url : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-700 break-all underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin enlaces</p>
          )}
        </div>
        <div>
          <h3 className="font-medium">Mensaje para el cliente</h3>
          <p className="break-words whitespace-pre-wrap">{p.mensaje_cliente || "Sin mensaje"}</p>
        </div>
      </section>
      <section className="border-line bg-surface space-y-4 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Archivos</h2>
        {reviewed && (
          <Alert tone="warning">
            Agregar, eliminar o reordenar archivos devuelve esta pieza a revisión y cancela la
            programación. El archivo editable no afecta la aprobación.
          </Alert>
        )}
        <p className="text-ink-muted text-sm">
          JPG, PNG, MP4 o MOV. El servidor valida formato, tamaño, relación de aspecto y duración
          según las redes y el tipo de pieza.
        </p>
        {!p.archivos.length && (
          <p className="text-ink-muted">Agrega los archivos antes de enviar a revisión.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {p.archivos.map((file, index) => (
            <article key={file.id} className="border-line space-y-3 rounded-lg border p-3">
              <h3 className="font-medium break-all">
                {index + 1}. {file.nombre_original}
              </h3>
              <ArchivoPreview archivo={file} />
              <p className="text-ink-muted text-xs">
                {file.ancho} × {file.alto} · {(file.tamano / 1024 / 1024).toFixed(2)} MB
                {file.duracion != null ? ` · ${file.duracion} s` : ""}
              </p>
              {editable && (
                <div className="flex flex-wrap gap-2">
                  {[-1, 1].map((delta) => (
                    <Button
                      key={delta}
                      size="sm"
                      variant="secondary"
                      disabled={busy || index + delta < 0 || index + delta >= p.archivos.length}
                      onClick={() => {
                        const ids = p.archivos.map((a) => a.id);
                        [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
                        const form = new FormData();
                        form.set("intent", "orden");
                        ids.forEach((id) => form.append("ids", id));
                        mutation.submit(form, { method: "post" });
                      }}
                      aria-label={`${delta < 0 ? "Subir" : "Bajar"} ${file.nombre_original}`}
                    >
                      {delta < 0 ? "Subir" : "Bajar"}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy}
                    onClick={() =>
                      mutation.submit(
                        { intent: "quitar-archivo", archivoId: file.id },
                        { method: "post" },
                      )
                    }
                  >
                    Eliminar archivo
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
        {editable && (
          <mutation.Form method="post" encType="multipart/form-data" className="space-y-3">
            <input type="hidden" name="intent" value="subir" />
            <Field label="Agregar archivos" htmlFor="archivos">
              <Input
                id="archivos"
                type="file"
                name="archivo"
                multiple
                accept=".jpg,.jpeg,.png,.mp4,.mov"
                required
              />
            </Field>
            <Button type="submit" loading={busy}>
              Subir archivos
            </Button>
          </mutation.Form>
        )}
        <div className="border-line space-y-3 border-t pt-4">
          <h3 className="font-medium">Archivo editable</h3>
          <p className="break-all">{p.archivo_editable_nombre || "Sin archivo editable"}</p>
          {p.tiene_archivo_editable && <EditableDownload piezaId={p.id} />}
          {editable && (
            <mutation.Form method="post" encType="multipart/form-data" className="space-y-3">
              <input type="hidden" name="intent" value="editable" />
              <Field
                label={
                  p.tiene_archivo_editable
                    ? "Reemplazar editable (máximo 500 MB)"
                    : "Agregar editable (máximo 500 MB)"
                }
                htmlFor="editable"
              >
                <Input id="editable" type="file" name="archivo" required />
              </Field>
              <Button type="submit" variant="secondary" loading={busy}>
                Guardar editable
              </Button>
            </mutation.Form>
          )}
        </div>
      </section>
      <Modal open={modal === "eliminar"} onClose={() => setModal("")} title="Eliminar borrador">
        <p className="mb-4">
          Se eliminarán la pieza y sus archivos. Esta acción no se puede deshacer.
        </p>
        {mutation.data?.error && <Alert tone="danger">{mutation.data.error}</Alert>}
        <Button variant="danger" loading={busy} onClick={() => act("eliminar")}>
          Eliminar borrador
        </Button>
      </Modal>
    </div>
  );
}
