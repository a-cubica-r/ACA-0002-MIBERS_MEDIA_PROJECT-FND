import { Alert } from "~/components/ui";
import type { Envio, EstadoPieza } from "~/lib/api/types";
import { EnviosTable } from "./envios-table";

export interface EnviosPiezaData {
  items: Envio[] | null;
  error: string | null;
}

/** Sección "Envíos al cliente" del detalle de la pieza (HU-19, RF18). */
export function EnviosPieza({ estado, envios }: { estado: EstadoPieza; envios: EnviosPiezaData }) {
  const compartible = estado === "PUBLICADA" || estado === "COMPARTIDA";
  if (!compartible && !envios.items?.length) return null;
  return (
    <section
      aria-labelledby="envios-pieza"
      className="border-line bg-surface space-y-4 rounded-xl border p-5"
    >
      <h2 id="envios-pieza" className="text-lg font-semibold">
        Envíos al cliente
      </h2>
      {envios.error !== null || !envios.items ? (
        <Alert tone="danger" title="No se pudo cargar el registro de envíos">
          {envios.error}
        </Alert>
      ) : envios.items.length === 0 ? (
        <p className="text-ink-muted">Esta pieza aún no se ha enviado al cliente.</p>
      ) : (
        <EnviosTable envios={envios.items} showPieza={false} />
      )}
    </section>
  );
}
