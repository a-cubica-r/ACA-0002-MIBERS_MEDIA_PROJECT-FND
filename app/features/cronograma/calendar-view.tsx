import clsx from "clsx";
import { Link } from "react-router";
import { Badge } from "~/components/ui";
import { EstadoPiezaBadge, ESTADO_PIEZA_TONE, RedChip } from "~/features/contenido/badges";
import type { Cronograma } from "~/lib/api/cronograma";
import type { PiezaResumen } from "~/lib/api/types";
import { formatDate, TIPO_PIEZA_LABEL } from "~/lib/format";
import { colombiaDay, colombiaTime, monthDays } from "./calendar";

function Piece({ pieza, compact = false }: { pieza: PiezaResumen; compact?: boolean }) {
  return (
    <Link
      to={`/piezas/${pieza.id}`}
      className="border-line hover:bg-surface-muted focus-visible:outline-brand-500 block min-w-0 rounded-lg border p-2 focus-visible:outline-2"
    >
      {compact ? (
        <Badge tone={ESTADO_PIEZA_TONE[pieza.estado]} className="max-w-full">
          <span className="min-w-0 truncate">
            {pieza.programada_para && colombiaTime(pieza.programada_para)} ·{" "}
            {pieza.titulo || "Sin título"}
          </span>
        </Badge>
      ) : (
        <div className="space-y-2 text-sm">
          <p className="text-ink-muted text-xs">
            {pieza.programada_para && colombiaTime(pieza.programada_para)} ·{" "}
            {TIPO_PIEZA_LABEL[pieza.tipo]}
          </p>
          <p className="text-ink font-medium break-words">{pieza.titulo || "Sin título"}</p>
          <div className="flex flex-wrap gap-1">
            {pieza.redes.map((red) => (
              <RedChip key={red} red={red} />
            ))}
          </div>
          <EstadoPiezaBadge estado={pieza.estado} />
        </div>
      )}
    </Link>
  );
}
export function CalendarView({ schedule }: { schedule: Cronograma }) {
  const today = colombiaDay();
  const days =
    schedule.vista === "mes" ? monthDays(schedule.desde) : schedule.dias.map((day) => day.fecha);
  const byDay = new Map(schedule.dias.map((day) => [day.fecha, day.piezas]));
  return (
    <>
      <div className="space-y-4 sm:hidden">
        {schedule.dias.map((day) => (
          <section key={day.fecha} className="bg-surface border-line rounded-xl border p-3">
            <h2 className="mb-3 text-sm font-semibold">
              {formatDate(day.fecha)}
              {day.fecha === today && " · Hoy"}
            </h2>
            <div className="space-y-2">
              {day.piezas.map((pieza) => (
                <Piece key={pieza.id} pieza={pieza} />
              ))}
              {!day.piezas.length && <p className="text-ink-muted text-sm">Sin piezas.</p>}
            </div>
          </section>
        ))}
      </div>
      <div className="border-line bg-surface hidden overflow-hidden rounded-xl border sm:block">
        <div className="border-line grid grid-cols-7 border-b">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <section
              key={day}
              className={clsx(
                "border-line min-h-36 min-w-0 border-r border-b p-2",
                !byDay.has(day) && "bg-canvas",
                day === today && "bg-brand-50",
              )}
            >
              <h2 className="mb-2 text-sm font-medium">
                <time dateTime={day} title={formatDate(day)}>
                  {Number(day.slice(-2))}
                  {day === today && " · Hoy"}
                </time>
              </h2>
              <div className="space-y-2">
                {(byDay.get(day) ?? []).map((pieza) => (
                  <Piece key={pieza.id} pieza={pieza} compact={schedule.vista === "mes"} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
