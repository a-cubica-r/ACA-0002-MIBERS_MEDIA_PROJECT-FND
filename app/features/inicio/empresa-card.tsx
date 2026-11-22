import clsx from "clsx";
import { Link } from "react-router";

import { Badge, type BadgeTone, Card, CardBody } from "~/components/ui";
import type { EmpresaActual, EstadoPieza } from "~/lib/api/types";
import {
  ESTADO_PIEZA_LABEL,
  ESTRATEGIA_LABEL,
  TIPO_PIEZA_LABEL,
  formatDateTime,
} from "~/lib/format";

const ESTADO_TONE: Record<EstadoPieza, BadgeTone> = {
  BORRADOR: "neutral",
  EN_REVISION: "info",
  CAMBIOS_SOLICITADOS: "warning",
  APROBADA: "brand",
  PROGRAMADA: "brand",
  PUBLICADA: "success",
  FALLIDA: "danger",
  COMPARTIDA: "neutral",
};

export function EmpresaCard({
  empresa,
  porConfirmar = 0,
}: {
  empresa: EmpresaActual;
  /** Tareas de publicacion pendientes de confirmar (publicacion manual asistida). */
  porConfirmar?: number;
}) {
  const { cliente, pendientes, proximas_publicaciones, semana_actual } = empresa;
  const { plan, programadas } = semana_actual;
  const avance = plan > 0 ? Math.min(100, Math.round((programadas / plan) * 100)) : 0;
  const chips = (
    [
      { label: "Borradores", value: pendientes.borradores, tone: "neutral" },
      { label: "En revisión", value: pendientes.en_revision, tone: "info" },
      { label: "Cambios solicitados", value: pendientes.cambios_solicitados, tone: "warning" },
      {
        label: "Aprobadas sin programar",
        value: pendientes.aprobadas_sin_programar,
        tone: "brand",
      },
      { label: "Fallidas", value: pendientes.fallidas, tone: "danger" },
      { label: "Publicaciones por confirmar", value: porConfirmar, tone: "warning" },
    ] satisfies { label: string; value: number; tone: BadgeTone }[]
  ).filter((chip) => chip.value > 0);

  return (
    <Card>
      <div className="border-line flex flex-col items-start gap-2 border-b px-4 py-4 sm:px-6">
        <Link
          to={`/clientes/${cliente.id}`}
          className="text-ink hover:text-brand-700 text-base font-semibold"
        >
          {cliente.nombre}
        </Link>
        <Badge tone="brand">{ESTRATEGIA_LABEL[cliente.estrategia]}</Badge>
      </div>

      <CardBody className="space-y-5">
        <section>
          <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
            Semana actual
          </h3>
          <p className="text-ink mt-2 text-sm">
            {programadas} de {plan} publicaciones programadas
          </p>
          <div
            role="progressbar"
            aria-valuenow={programadas}
            aria-valuemin={0}
            aria-valuemax={plan}
            aria-label="Avance de la semana"
            className="bg-surface-muted mt-2 h-2 w-full overflow-hidden rounded-full"
          >
            <div
              className={clsx(
                "h-full rounded-full",
                programadas >= plan ? "bg-success-700" : "bg-brand-600",
              )}
              style={{ width: `${avance}%` }}
            />
          </div>
        </section>

        <section>
          <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
            Pendientes
          </h3>
          {chips.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <Badge tone={chip.tone}>
                    {chip.label}: {chip.value}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted mt-2 text-sm">Sin pendientes</p>
          )}
        </section>

        <section>
          <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">
            Próximas publicaciones
          </h3>
          {proximas_publicaciones.length > 0 ? (
            <ul className="mt-2 space-y-3">
              {proximas_publicaciones.slice(0, 5).map((pieza) => (
                <li key={pieza.id} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-ink-muted text-xs">
                      {pieza.programada_para ? formatDateTime(pieza.programada_para) : "Sin fecha"}
                    </span>
                    <Badge tone={ESTADO_TONE[pieza.estado]}>
                      {ESTADO_PIEZA_LABEL[pieza.estado]}
                    </Badge>
                  </div>
                  <p className="text-ink mt-1 font-medium">{pieza.titulo}</p>
                  <p className="text-ink-muted text-xs">{TIPO_PIEZA_LABEL[pieza.tipo]}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted mt-2 text-sm">No hay publicaciones próximas</p>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
