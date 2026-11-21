import { Form, Link } from "react-router";
import type { Route } from "./+types/cumplimiento";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  PageHeader,
} from "~/components/ui";
import { getCumplimiento, type Cumplimiento } from "~/lib/api/cumplimiento";
import { requireAdmin } from "~/lib/auth/guards";

export const meta: Route.MetaFunction = () => [{ title: "Cumplimiento · Mibers" }];

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAdmin(request);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  const query = new URL(request.url).searchParams;
  const desde = query.get("desde") || undefined;
  const hasta = query.get("hasta") || undefined;
  const [week, month, range] = await Promise.all([
    getCumplimiento({ desde: start.toISOString().slice(0, 10), hasta: today }),
    getCumplimiento(),
    desde || hasta ? getCumplimiento({ desde, hasta }) : Promise.resolve(null),
  ]);
  return { week, month, range, desde, hasta };
}

function Indicator({ title, value }: { title: string; value: Cumplimiento }) {
  const percentage = value.porcentaje;
  const meets = percentage !== null && percentage >= value.meta;
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="space-y-4">
        <p className="text-3xl font-semibold">
          {percentage === null
            ? "Sin datos"
            : `${percentage.toLocaleString("es-CO", { maximumFractionDigits: 2 })} %`}
        </p>
        {percentage !== null && (
          <Badge tone={meets ? "success" : "warning"}>
            {meets ? "Cumple la meta" : "Bajo la meta"}
          </Badge>
        )}
        <p className="text-ink-muted text-sm">
          {value.dentro_de_5_min} de {value.total} publicaciones a tiempo
        </p>
        <div
          role="meter"
          aria-label={title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage ?? 0}
          aria-valuetext={
            percentage === null ? "Sin datos" : `${percentage} %, meta ${value.meta} %`
          }
          className="bg-surface-muted relative h-3 rounded-full"
        >
          <div
            className="bg-brand-600 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, percentage ?? 0))}%` }}
          />
          <span
            aria-hidden="true"
            className="bg-ink absolute -top-1 h-5 w-0.5"
            style={{ left: `${value.meta}%` }}
          />
        </div>
        <p className="text-ink-muted text-xs">Marca de la meta: {value.meta} %</p>
      </CardBody>
    </Card>
  );
}

export default function CumplimientoPage({ loaderData }: Route.ComponentProps) {
  const { week, month, range, desde, hasta } = loaderData;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cumplimiento de publicación"
        description="Publicaciones avisadas dentro de ±5 minutos de la hora programada. Meta: 95 %."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Indicator title="Últimos 7 días" value={week} />
        <Indicator title="Últimos 30 días" value={month} />
      </div>
      <Card>
        <CardHeader title="Consultar un rango" description="Fechas en hora de Colombia." />
        <CardBody>
          <Form method="get" className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="desde" className="mb-1 block text-sm">
                Desde
              </label>
              <Input id="desde" name="desde" type="date" defaultValue={desde} max={hasta} />
            </div>
            <div>
              <label htmlFor="hasta" className="mb-1 block text-sm">
                Hasta
              </label>
              <Input id="hasta" name="hasta" type="date" defaultValue={hasta} min={desde} />
            </div>
            <Button type="submit">Consultar</Button>
          </Form>
        </CardBody>
      </Card>
      {range && <Indicator title="Rango consultado" value={range} />}
      <Alert tone="info">
        Recuerda confirmar las publicaciones con su enlace en{" "}
        <Link to="/publicaciones" className="text-brand-700 underline">
          Publicaciones
        </Link>{" "}
        para mantener el seguimiento actualizado.
      </Alert>
    </div>
  );
}
