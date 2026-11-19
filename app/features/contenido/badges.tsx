import { Badge } from "~/components/ui";
import type { EstadoPieza, Red } from "~/lib/api/types";
import { ESTADO_PIEZA_LABEL, RED_LABEL } from "~/lib/format";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export const ESTADO_PIEZA_TONE: Record<EstadoPieza, Tone> = {
  BORRADOR: "neutral",
  EN_REVISION: "info",
  CAMBIOS_SOLICITADOS: "warning",
  APROBADA: "brand",
  PROGRAMADA: "brand",
  PUBLICADA: "success",
  FALLIDA: "danger",
  COMPARTIDA: "success",
};

/** Estado de una pieza (RF10) con color consistente en todo el aplicativo. */
export function EstadoPiezaBadge({ estado }: { estado: EstadoPieza }) {
  return <Badge tone={ESTADO_PIEZA_TONE[estado]}>{ESTADO_PIEZA_LABEL[estado]}</Badge>;
}

/** Chip de red social (Instagram / Facebook). */
export function RedChip({ red }: { red: Red }) {
  return (
    <span className="border-line text-ink-muted inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
      <span
        aria-hidden="true"
        className={
          red === "INSTAGRAM"
            ? "bg-brand-500 size-1.5 rounded-full"
            : "bg-info-700 size-1.5 rounded-full"
        }
      />
      {RED_LABEL[red]}
    </span>
  );
}
