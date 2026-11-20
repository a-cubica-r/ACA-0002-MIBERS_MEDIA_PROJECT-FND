import { Link, redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/cronograma";
import { buttonClasses, Field, Input, PageHeader, Select } from "~/components/ui";
import { EstadoPiezaBadge } from "~/features/contenido/badges";
import { CalendarView } from "~/features/cronograma/calendar-view";
import { colombiaDay, movePeriod, validDay } from "~/features/cronograma/calendar";
import { listClientes } from "~/lib/api/clientes";
import { getCronograma } from "~/lib/api/cronograma";
import type { Cliente, EstadoPieza, Red } from "~/lib/api/types";
import { requireUser } from "~/lib/auth/guards";
import { ESTADO_PIEZA_LABEL, formatDate, RED_LABEL } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Cronograma | Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const query = new URL(request.url).searchParams;
  const clientes: Cliente[] = [];
  let page = 1;
  let more = true;
  while (more) {
    const result = await listClientes({ activo: true, pageSize: 100, page });
    clientes.push(...result.results);
    more = !!result.next;
    page++;
  }
  const cliente = query.get("cliente") ?? clientes[0]?.id;
  const vista: "mes" | "semana" = query.get("vista") === "mes" ? "mes" : "semana";
  const rawDate = query.get("fecha");
  const fecha = validDay(rawDate) ? rawDate : colombiaDay();
  const red = query.get("red") as Red | null;
  const estado = query.get("estado") as EstadoPieza | null;
  if (
    cliente &&
    (query.get("cliente") !== cliente ||
      query.get("vista") !== vista ||
      query.get("fecha") !== fecha)
  ) {
    query.set("cliente", cliente);
    query.set("vista", vista);
    query.set("fecha", fecha);
    throw redirect(`/cronograma?${query}`);
  }
  const schedule = cliente
    ? await getCronograma(cliente, {
        vista,
        fecha,
        red: red && red in RED_LABEL ? red : undefined,
        estado: estado && estado in ESTADO_PIEZA_LABEL ? estado : undefined,
      })
    : null;
  return { clientes, cliente, vista, fecha, schedule };
}
export default function CronogramaPage({ loaderData }: Route.ComponentProps) {
  const { clientes, cliente, vista, fecha, schedule } = loaderData;
  const [query, setQuery] = useSearchParams();
  function change(name: string, value: string) {
    const next = new URLSearchParams(query);
    if (value) next.set(name, value);
    else next.delete(name);
    setQuery(next);
  }
  function href(date: string) {
    const next = new URLSearchParams(query);
    next.set("fecha", date);
    return `?${next}`;
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cronograma"
        description="Planeación en hora de Colombia (America/Bogota)."
        actions={
          cliente && (
            <Link
              className={buttonClasses()}
              to={`/piezas/nueva?cliente=${encodeURIComponent(cliente)}`}
            >
              Nueva pieza
            </Link>
          )
        }
      />
      <div className="bg-surface border-line grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Cliente" htmlFor="schedule-client" required>
          <Select
            id="schedule-client"
            value={cliente ?? ""}
            onChange={(e) => change("cliente", e.target.value)}
          >
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Vista" htmlFor="schedule-view">
          <Select
            id="schedule-view"
            value={vista}
            onChange={(e) => change("vista", e.target.value)}
          >
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </Select>
        </Field>
        <Field label="Fecha" htmlFor="schedule-date">
          <Input
            id="schedule-date"
            type="date"
            value={fecha}
            onChange={(e) => {
              if (validDay(e.target.value)) change("fecha", e.target.value);
            }}
          />
        </Field>
        <Field label="Red" htmlFor="schedule-network">
          <Select
            id="schedule-network"
            value={query.get("red") ?? ""}
            onChange={(e) => change("red", e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(RED_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado" htmlFor="schedule-state">
          <Select
            id="schedule-state"
            value={query.get("estado") ?? ""}
            onChange={(e) => change("estado", e.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(ESTADO_PIEZA_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {schedule ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">
              {formatDate(schedule.desde)} – {formatDate(schedule.hasta)}
            </h2>
            <nav aria-label="Navegar cronograma" className="flex gap-2">
              {[
                [-1, "Anterior"],
                [0, "Hoy"],
                [1, "Siguiente"],
              ].map(([direction, label]) => (
                <Link
                  key={label}
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                  to={href(
                    direction === 0 ? colombiaDay() : movePeriod(fecha, vista, Number(direction)),
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <CalendarView schedule={schedule} />
          <div aria-label="Leyenda de estados" className="flex flex-wrap items-center gap-2">
            <span className="text-ink-muted text-sm">Estados:</span>
            {(Object.keys(ESTADO_PIEZA_LABEL) as EstadoPieza[]).map((estado) => (
              <EstadoPiezaBadge key={estado} estado={estado} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-ink-muted">No hay clientes activos para mostrar un cronograma.</p>
      )}
    </div>
  );
}
