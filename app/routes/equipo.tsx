import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/equipo";
import { Card, CardBody, PageHeader } from "~/components/ui";
import { requireAdmin } from "~/lib/auth/guards";
import { initializeTareas, listPersonas, listTareas } from "~/lib/api/tareas";
import { clientesTareas } from "~/features/tareas/data";
import { esVencida, metricasClientes, metricasPersonas } from "~/features/tareas/metricas-equipo";
import { MockNotice } from "~/features/tareas/mock-notice";
import { useLiveTareas } from "~/features/tareas/use-live-tareas";
import { formatDate } from "~/lib/format";
export const meta = () => [{ title: "Supervisión del equipo · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAdmin(request);
  const clientes = await clientesTareas();
  await initializeTareas(user, clientes);
  const [tareas, personas] = await Promise.all([listTareas(), listPersonas()]);
  return { tareas, personas, clientes };
}
export default function Equipo() {
  const { tareas, personas, clientes } = useLoaderData<typeof clientLoader>();
  useLiveTareas();
  const equipo = metricasPersonas(tareas, personas);
  const avance = metricasClientes(tareas, clientes);
  const vencidas = tareas
    .filter((t) => esVencida(t))
    .sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite));
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Supervisión del equipo"
        description="Avance, plazos y distribución del trabajo."
      />
      <MockNotice />
      <p className="text-ink-muted text-sm">
        Actualización cada 15 segundos y al volver a esta ventana. Datos guardados en este
        navegador.
      </p>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Carga por persona</h2>
        <p className="text-ink-muted text-sm">
          Carga relativa a la persona con más tareas abiertas; no representa horas ni capacidad.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {equipo.map((p) => (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                <Link
                  className="text-brand-700 font-semibold underline"
                  to={`/tareas?persona=${p.id}`}
                >
                  {p.nombre}
                </Link>
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt>Abiertas</dt>
                    <dd className="text-xl font-semibold">{p.abiertas}</dd>
                  </div>
                  <div>
                    <dt>Vencidas</dt>
                    <dd className="text-danger-700 text-xl font-semibold">{p.vencidas}</dd>
                  </div>
                  <div>
                    <dt>Completadas (7 días)</dt>
                    <dd className="text-xl font-semibold">{p.completadas}</dd>
                  </div>
                </dl>
                <progress
                  aria-label={`Carga de ${p.nombre}`}
                  value={p.carga}
                  max={100}
                  className="accent-brand-600 h-3 w-full"
                />
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Avance por cliente</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {avance.map((c) => (
            <Card key={c.id}>
              <CardBody className="space-y-3">
                <Link
                  className="text-brand-700 font-semibold underline"
                  to={`/tareas?cliente=${c.id}`}
                >
                  {c.nombre}
                </Link>
                <p>
                  {c.total
                    ? `${c.avance}% · ${c.completadas} de ${c.total} tareas completadas`
                    : "Sin tareas"}
                </p>
                <progress
                  aria-label={`Avance de ${c.nombre}`}
                  value={c.avance}
                  max={100}
                  className="accent-brand-600 h-3 w-full"
                />
                <p className="text-danger-700 text-sm">{c.vencidas} vencidas</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tareas vencidas ({vencidas.length})</h2>
        {!vencidas.length && <p className="text-ink-muted">No hay tareas vencidas.</p>}
        {vencidas.map((t) => (
          <Card key={t.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link className="text-brand-700 font-medium underline" to={`/tareas?tarea=${t.id}`}>
                  {t.titulo}
                </Link>
                <p className="text-ink-muted text-sm">
                  {t.asignado_a.nombre} · {clientes.find((c) => c.id === t.cliente_id)?.nombre}
                </p>
              </div>
              <p className="text-danger-700 text-sm">Venció el {formatDate(t.fecha_limite)}</p>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
