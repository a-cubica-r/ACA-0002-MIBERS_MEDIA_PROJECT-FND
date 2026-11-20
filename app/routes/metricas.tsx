import { Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/metricas";
import {
  Alert,
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  Select,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  buttonClasses,
} from "~/components/ui";
import { MetricasTabs } from "~/features/metricas/metricas-tabs";
import { MonthlyChart } from "~/features/metricas/monthly-chart";
import { metricasClientes } from "~/features/metricas/clientes";
import {
  currentMonth,
  shiftMonth,
  METRIC_LABEL,
  numberLabel,
  percentLabel,
  tasaInteraccion,
  total,
  variacion,
} from "~/features/metricas/calculos";
import { allMetricas, METRIC_FIELDS, syncMetricas } from "~/lib/api/metricas";
import { ApiError } from "~/lib/api/errors";
import { requireAdmin, requireUser } from "~/lib/auth/guards";
import { RED_LABEL } from "~/lib/format";
export const meta: Route.MetaFunction = () => [{ title: "Tablero de indicadores | Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireUser(request);
  const query = new URL(request.url).searchParams;
  const selection = await metricasClientes(query);
  const red =
    query.get("red") === "INSTAGRAM"
      ? ("INSTAGRAM" as const)
      : query.get("red") === "FACEBOOK"
        ? ("FACEBOOK" as const)
        : undefined;
  const periodo = query.get("periodo") === "12" ? 12 : 6;
  const hasta = currentMonth();
  const desde = shiftMonth(hasta, 1 - periodo);
  const rows = selection.cliente
    ? await allMetricas({ cliente: selection.cliente, red, desde, hasta })
    : [];
  return {
    ...selection,
    rows,
    red,
    periodo,
    hasta,
    months: Array.from({ length: periodo }, (_, i) => shiftMonth(desde, i)),
    admin: user.role === "ADMIN",
  };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const cliente = String(form.get("cliente") ?? "");
  if (!cliente) return { ok: false, error: "Selecciona un cliente." };
  try {
    const rows = await syncMetricas(cliente, currentMonth());
    return {
      ok: true,
      message: rows.length
        ? `Se sincronizaron ${rows.length} registros de Meta.`
        : "Meta no devolvió registros nuevos. Puede no estar configurado o los registros manuales ya están protegidos.",
    };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    throw error;
  }
}
export default function MetricasPage({ loaderData, actionData }: Route.ComponentProps) {
  const { clientes, cliente, rows, red, periodo, months, hasta, admin } = loaderData;
  const navigation = useNavigation();
  const latest = [...rows].sort((a, b) => b.mes.localeCompare(a.mes))[0]?.mes ?? hasta;
  const current = rows.filter((row) => row.mes === latest);
  const previous = rows.filter((row) => row.mes === shiftMonth(latest, -1));
  // Compare identical network coverage to avoid presenting missing networks as growth.
  const comparable =
    current.length > 0 &&
    current.length === previous.length &&
    current.every((row) => previous.some((old) => old.red === row.red));
  const rate = tasaInteraccion(total(current, "interacciones"), total(current, "alcance"));
  const oldRate = comparable
    ? tasaInteraccion(total(previous, "interacciones"), total(previous, "alcance"))
    : null;
  const cargar = `/metricas/cargar?${new URLSearchParams({ cliente })}`;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tablero de indicadores"
        description="Informe mensual de alcance, visualizaciones, interacciones y seguidores."
        actions={
          <Link className={buttonClasses()} to={cargar}>
            Cargar métricas
          </Link>
        }
      />
      <MetricasTabs cliente={cliente} />
      <Form
        method="get"
        className="bg-surface border-line grid gap-4 rounded-xl border p-4 sm:grid-cols-4"
      >
        <label className="space-y-1 text-sm">
          Cliente
          <Select name="cliente" defaultValue={cliente} key={cliente}>
            {clientes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          Red
          <Select name="red" defaultValue={red ?? ""}>
            <option value="">Todas</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          Periodo
          <Select name="periodo" defaultValue={periodo}>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Últimos 12 meses</option>
          </Select>
        </label>
        <Button type="submit" className="self-end" loading={navigation.state === "loading"}>
          Consultar
        </Button>
      </Form>
      {actionData && (
        <Alert tone={actionData.ok ? "info" : "danger"}>
          {actionData.ok ? actionData.message : actionData.error}
        </Alert>
      )}
      {admin && cliente && (
        <Form method="post">
          <input type="hidden" name="cliente" value={cliente} />
          <Button type="submit" variant="secondary" loading={navigation.state === "submitting"}>
            Sincronizar mes actual desde Meta
          </Button>
          <p className="text-ink-muted mt-2 text-xs">
            Requiere una conexión Meta configurada. Conserva las cargas manuales.
          </p>
        </Form>
      )}
      {!rows.length ? (
        <EmptyState
          title="Aún no hay métricas para este periodo"
          description="Selecciona otro cliente o registra los indicadores de un mes."
          action={
            cliente ? (
              <Link to={cargar} className={buttonClasses()}>
                Cargar métricas
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div>
            <h2 className="font-semibold">Último mes con datos: {latest}</h2>
            <p className="text-ink-muted text-sm">
              Variación frente a {shiftMonth(latest, -1)}. Todas suma las redes con registros; no
              equivale a personas únicas. Un campo incompleto se muestra sin dato.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {METRIC_FIELDS.map((field) => (
              <Card key={field}>
                <CardBody>
                  <h3 className="text-ink-muted text-sm">{METRIC_LABEL[field]}</h3>
                  <p className="mt-2 text-2xl font-semibold">
                    {numberLabel(total(current, field))}
                  </p>
                  <p className="text-ink-muted mt-2 text-xs">
                    {percentLabel(
                      comparable ? variacion(total(current, field), total(previous, field)) : null,
                    )}
                  </p>
                </CardBody>
              </Card>
            ))}
            <Card>
              <CardBody>
                <h3 className="text-ink-muted text-sm">Tasa de interacción</h3>
                <p className="mt-2 text-2xl font-semibold">
                  {rate === null ? "Sin dato" : `${numberLabel(rate)} %`}
                </p>
                <p className="text-ink-muted mt-2 text-xs">
                  {percentLabel(variacion(rate, oldRate))} · interacciones / alcance
                </p>
              </CardBody>
            </Card>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <MonthlyChart
              rows={rows}
              months={months}
              field="alcance"
              title="Alcance mensual por red"
            />
            <MonthlyChart
              rows={rows}
              months={months}
              field="seguidores"
              title="Evolución de seguidores"
            />
          </div>
          <section className="space-y-3">
            <h2 className="font-semibold">Detalle mensual por red</h2>
            <Table>
              <caption className="sr-only">Indicadores mensuales del cliente seleccionado</caption>
              <THead>
                <TR>
                  <TH>Mes</TH>
                  <TH>Red</TH>
                  {METRIC_FIELDS.map((field) => (
                    <TH key={field}>{METRIC_LABEL[field]}</TH>
                  ))}
                  <TH>Tasa</TH>
                  <TH>Origen</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <TR key={row.id}>
                    <TD>{row.mes}</TD>
                    <TD>{RED_LABEL[row.red]}</TD>
                    {METRIC_FIELDS.map((field) => (
                      <TD key={field}>{numberLabel(row[field])}</TD>
                    ))}
                    <TD>
                      {tasaInteraccion(row.interacciones, row.alcance) === null
                        ? "Sin dato"
                        : `${numberLabel(tasaInteraccion(row.interacciones, row.alcance))} %`}
                    </TD>
                    <TD>{row.origen === "API" ? "Meta" : "Manual"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}
