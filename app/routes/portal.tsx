import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/portal";
import { Alert, Card, CardBody } from "~/components/ui";
import { getCliente } from "~/lib/api/clientes";
import { apiFetch } from "~/lib/api/client";
import { ApiError } from "~/lib/api/errors";
import type { Paginated, Red } from "~/lib/api/types";
import { requireUser } from "~/lib/auth/guards";
import { useIdleLogout } from "~/lib/auth/idle";
import { ESTADO_CUENTA_LABEL, formatDateTime, RED_LABEL, TIPO_PIEZA_LABEL } from "~/lib/format";
import { piezasTareas } from "~/features/tareas/data";
import { hoyColombia } from "~/features/tareas/metricas-equipo";
interface MetricaPortal {
  id: string;
  red: Red;
  mes: string;
  alcance: number | null;
}
export const meta = () => [{ title: "Portal del cliente · Mibers Creativos" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const today = hoyColombia();
  const previous = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const mes = previous.toISOString().slice(0, 7);
  const metricas = async () => {
    try {
      const result = await apiFetch<Paginated<MetricaPortal>>(
        `metricas?cliente=${encodeURIComponent(params.clienteId)}&desde=${mes}&hasta=${mes}`,
      );
      return { results: result.results, error: null };
    } catch (error) {
      if (error instanceof ApiError)
        return {
          results: [] as MetricaPortal[],
          error: "No fue posible consultar las métricas. Intenta nuevamente más tarde.",
        };
      throw error;
    }
  };
  const [cliente, piezas, resumen] = await Promise.all([
    getCliente(params.clienteId),
    piezasTareas(params.clienteId),
    metricas(),
  ]);
  return {
    cliente,
    mes,
    metricas: resumen.results,
    errorMetricas: resumen.error,
    publicaciones: piezas
      .filter(
        (p) =>
          p.programada_para &&
          Date.parse(p.programada_para) >= Date.now() &&
          !["PUBLICADA", "COMPARTIDA"].includes(p.estado),
      )
      .sort((a, b) => Date.parse(a.programada_para!) - Date.parse(b.programada_para!))
      .slice(0, 20),
  };
}
export default function Portal() {
  useIdleLogout();
  const { cliente, mes, metricas, errorMetricas, publicaciones } =
    useLoaderData<typeof clientLoader>();
  return (
    <main className="bg-canvas text-ink min-h-dvh">
      <div className="bg-brand-50 border-brand-200 border-b px-4 py-3 text-center text-sm">
        Vista previa del portal del cliente — así verá {cliente.nombre} su resumen cuando tenga
        acceso.{" "}
        <Link
          className="text-brand-700 ml-2 font-semibold underline"
          to={`/clientes/${cliente.id}`}
        >
          Volver a la ficha
        </Link>
      </div>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <p className="text-brand-700 font-bold">Mibers Creativos</p>
          <h1 className="text-3xl font-bold break-words">{cliente.nombre}</h1>
          <p className="text-ink-muted">El resumen de tus redes y las próximas publicaciones.</p>
        </header>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Tus redes sociales</h2>
          {!cliente.cuentas.length && (
            <p className="text-ink-muted">Aún no hay redes registradas.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {cliente.cuentas.map((cuenta) => (
              <Card key={cuenta.id}>
                <CardBody className="space-y-2">
                  <h3 className="font-semibold">{RED_LABEL[cuenta.red]}</h3>
                  <p className="break-words">{cuenta.handle}</p>
                  <p className="text-ink-muted text-sm">{ESTADO_CUENTA_LABEL[cuenta.estado]}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Alcance del último mes · {mes}</h2>
          {errorMetricas && <Alert tone="warning">{errorMetricas}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            {(["INSTAGRAM", "FACEBOOK"] as const).map((red) => {
              const metrica = metricas.find((m) => m.red === red);
              return (
                <Card key={red}>
                  <CardBody>
                    <h3 className="text-ink-muted text-sm">{RED_LABEL[red]}</h3>
                    <p className="mt-2 text-2xl font-semibold">
                      {metrica?.alcance == null
                        ? "Sin datos disponibles"
                        : metrica.alcance.toLocaleString("es-CO")}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Próximas publicaciones</h2>
          <p className="text-ink-muted text-sm">
            Las próximas 20 publicaciones con fecha prevista.
          </p>
          {!publicaciones.length && (
            <p className="text-ink-muted">Aún no hay publicaciones próximas con fecha prevista.</p>
          )}
          <div className="space-y-3">
            {publicaciones.map((p) => (
              <Card key={p.id}>
                <CardBody className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div className="min-w-0">
                    <h3 className="font-semibold break-words">{p.titulo}</h3>
                    <p className="text-ink-muted text-sm">
                      {TIPO_PIEZA_LABEL[p.tipo]} · {p.redes.map((r) => RED_LABEL[r]).join(", ")}
                    </p>
                    <p className="mt-1 text-sm">{formatDateTime(p.programada_para!)}</p>
                  </div>
                  <p className="text-brand-700 text-sm font-semibold">
                    {p.estado === "PROGRAMADA" ? "Programada" : "En preparación"}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
        <footer className="text-ink-muted border-line border-t py-4 text-sm">
          Mibers Creativos · Información de consulta
        </footer>
      </div>
    </main>
  );
}
