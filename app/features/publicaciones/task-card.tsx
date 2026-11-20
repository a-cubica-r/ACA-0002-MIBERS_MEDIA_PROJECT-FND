import { useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import { Badge, Button, CopyButton, Field, Input, Modal, Textarea } from "~/components/ui";
import { RedChip } from "~/features/contenido/badges";
import {
  descargarArchivoPublicacion,
  getArchivosPublicacion,
  type ArchivoPublicacion,
  type TareaPublicacion,
} from "~/lib/api/publicaciones";
import { ApiError } from "~/lib/api/errors";
import { formatDateTime, TIPO_PIEZA_LABEL } from "~/lib/format";
import type { clientAction } from "~/routes/publicaciones";

const labels = {
  PENDIENTE: "Pendiente",
  PUBLICADA: "Publicada",
  FALLIDA: "Fallida",
  CANCELADA: "Cancelada",
};
function TaskModal({
  task,
  intent,
  onClose,
}: {
  task: TareaPublicacion;
  intent: "confirmar" | "fallar";
  onClose: () => void;
}) {
  const fetcher = useFetcher<typeof clientAction>();
  const confirm = intent === "confirmar";
  useEffect(() => {
    if (fetcher.data?.ok) onClose();
  }, [fetcher.data, onClose]);
  return (
    <Modal open onClose={onClose} title={confirm ? "Confirmar publicación" : "Reportar fallo"}>
      <fetcher.Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={intent} />
        <input type="hidden" name="id" value={task.id} />
        <p className="text-sm">
          {task.cliente_nombre} · {task.pieza_titulo} · {task.cuenta_handle}
        </p>
        {confirm ? (
          <Field
            hint="Usa un enlace HTTPS de la misma red social de esta tarea."
            label="Enlace de la publicación"
            htmlFor={`link-${task.id}`}
            required
          >
            <Input
              id={`link-${task.id}`}
              name="enlace"
              type="url"
              required
              maxLength={500}
              placeholder="https://www.instagram.com/p/..."
            />
          </Field>
        ) : (
          <Field label="Motivo del fallo" htmlFor={`reason-${task.id}`} required>
            <Textarea id={`reason-${task.id}`} name="motivo" required rows={4} />
          </Field>
        )}
        {fetcher.data && !fetcher.data.ok && (
          <p role="alert" className="text-danger-700 text-sm">
            {fetcher.data.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={fetcher.state !== "idle"}>
            Cancelar
          </Button>
          <Button type="submit" loading={fetcher.state !== "idle"}>
            {confirm ? "Confirmar publicada" : "Reportar fallo"}
          </Button>
        </div>
      </fetcher.Form>
    </Modal>
  );
}
export function TaskCard({ task, now }: { task: TareaPublicacion; now: number }) {
  const retry = useFetcher<typeof clientAction>();
  const [intent, setIntent] = useState<"confirmar" | "fallar" | null>(null);
  const [files, setFiles] = useState<ArchivoPublicacion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const overdue = task.estado === "PENDIENTE" && Date.parse(task.programada_para) < now;
  async function loadFiles() {
    setBusy(true);
    setError("");
    try {
      setFiles(await getArchivosPublicacion(task.pieza));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else throw e;
    } finally {
      setBusy(false);
    }
  }
  async function download(id: string) {
    setBusy(true);
    setError("");
    try {
      const { blob, filename } = await descargarArchivoPublicacion(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else throw e;
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="bg-surface border-line space-y-4 rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink-muted text-sm">{task.cliente_nombre}</p>
          <h2 className="font-semibold break-words">
            <Link className="hover:text-brand-700 underline" to={`/piezas/${task.pieza}`}>
              {task.pieza_titulo || "Sin título"}
            </Link>
          </h2>
          <p className="text-ink-muted mt-1 text-xs">
            {TIPO_PIEZA_LABEL[task.pieza_tipo]} ·{" "}
            {task.modo === "MANUAL" ? "Publicación manual asistida" : "Publicación automática"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            tone={
              task.estado === "PUBLICADA"
                ? "success"
                : task.estado === "FALLIDA"
                  ? "danger"
                  : "neutral"
            }
          >
            {labels[task.estado]}
          </Badge>
          {overdue && <Badge tone="warning">Vencida · pendiente de publicar</Badge>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <RedChip red={task.red} />
        <a
          className="text-brand-700 break-all underline"
          href={task.cuenta_url}
          target="_blank"
          rel="noreferrer"
        >
          {task.cuenta_handle}
        </a>
        <span>Programada: {formatDateTime(task.programada_para)}</span>
      </div>
      <div className="bg-canvas rounded-lg p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Copy para esta red</h3>
          <CopyButton value={task.copy_final} label="Copiar copy" />
        </div>
        <p className="max-h-64 overflow-auto text-sm break-words whitespace-pre-wrap">
          {task.copy_final || "Sin copy."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {files === null ? (
          <Button size="sm" variant="secondary" loading={busy} onClick={loadFiles}>
            Ver archivos para descargar
          </Button>
        ) : files.length ? (
          files.map((file) => (
            <Button
              key={file.id}
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => download(file.id)}
            >
              <span className="break-all">Descargar {file.nombre_original}</span>
            </Button>
          ))
        ) : (
          <p className="text-ink-muted text-sm">La pieza no tiene archivos.</p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger-700 text-sm">
          {error}
        </p>
      )}
      {task.enlace && (
        <p className="text-sm">
          Publicación:{" "}
          <a
            href={task.enlace}
            target="_blank"
            rel="noreferrer"
            className="text-brand-700 break-all underline"
          >
            {task.enlace}
          </a>
        </p>
      )}
      {task.motivo && (
        <p className="text-danger-700 text-sm break-words whitespace-pre-wrap">
          Motivo del fallo: {task.motivo}
        </p>
      )}
      {(task.gestionada_por_username || task.publicada_at) && (
        <p className="text-ink-muted text-xs">
          {task.gestionada_por_username && `Gestionada por ${task.gestionada_por_username}`}
          {task.publicada_at && ` · ${formatDateTime(task.publicada_at)}`}
        </p>
      )}
      {task.estado === "PENDIENTE" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIntent("confirmar")}>
            Confirmar publicada
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIntent("fallar")}>
            Reportar fallo
          </Button>
        </div>
      )}
      {intent && <TaskModal task={task} intent={intent} onClose={() => setIntent(null)} />}
    </article>
  );
}
