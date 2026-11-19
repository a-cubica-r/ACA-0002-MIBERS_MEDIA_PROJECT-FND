import { useEffect, useState } from "react";
import type { ArchivoPieza } from "~/lib/api/piezas";
import { downloadArchivo, downloadEditable } from "~/lib/api/piezas";
import { ApiError } from "~/lib/api/errors";
import { Button } from "~/components/ui";
export function ArchivoPreview({ archivo }: { archivo: ArchivoPieza }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    downloadArchivo(archivo.id)
      .then(({ blob }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((e: unknown) => {
        if (active)
          setError(e instanceof ApiError ? e.message : "No se pudo cargar la vista previa.");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [archivo.id]);
  return (
    <div className="space-y-2">
      {url ? (
        <>
          {archivo.kind === "image" ? (
            <img
              src={url}
              alt={archivo.nombre_original}
              className="max-h-64 w-full rounded-lg object-contain"
            />
          ) : (
            <video src={url} controls preload="metadata" className="max-h-64 w-full rounded-lg" />
          )}
          <a className="text-brand-700 underline" href={url} download={archivo.nombre_original}>
            Descargar
          </a>
        </>
      ) : (
        <p className="text-ink-muted" role={error ? "alert" : "status"}>
          {error || "Cargando vista previa…"}
        </p>
      )}
    </div>
  );
}
export function EditableDownload({ piezaId }: { piezaId: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const { blob, filename } = await downloadEditable(piezaId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) {
            if (e instanceof ApiError) setError(e.message);
            else throw e;
          } finally {
            setBusy(false);
          }
        }}
      >
        Descargar editable
      </Button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
