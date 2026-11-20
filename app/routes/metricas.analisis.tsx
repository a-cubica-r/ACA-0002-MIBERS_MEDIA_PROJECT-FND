import { Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/metricas.analisis";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
} from "~/components/ui";
import { MetricasTabs } from "~/features/metricas/metricas-tabs";
import { metricasClientes } from "~/features/metricas/clientes";
import { requireUser } from "~/lib/auth/guards";
import { getAnalisis } from "~/lib/mock/analisis";
export const meta: Route.MetaFunction = () => [{ title: "Análisis asistido por IA | Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const selection = await metricasClientes(new URL(request.url).searchParams);
  return { ...selection, analisis: selection.cliente ? await getAnalisis(selection.cliente) : [] };
}
export default function AnalisisPage({ loaderData }: Route.ComponentProps) {
  const { cliente, clientes, analisis } = loaderData;
  const navigation = useNavigation();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Análisis asistido por IA"
        description="Recepción del público por publicación: sentimiento, temas y comentarios representativos."
      />
      <MetricasTabs cliente={cliente} />
      <Alert tone="warning">
        Datos de demostración: el análisis con IA se conectará cuando el backend lo implemente.
      </Alert>
      <p className="text-ink-muted text-sm">
        Los porcentajes, comentarios y resúmenes son simulados, incluso cuando el título corresponde
        a una pieza real. Esta vista analiza la recepción y no genera copies.
      </p>
      <Form method="get" className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 space-y-1 text-sm">
          Cliente
          <Select name="cliente" defaultValue={cliente} key={cliente}>
            {clientes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" loading={navigation.state === "loading"} disabled={!cliente}>
          Consultar análisis
        </Button>
      </Form>
      {!analisis.length ? (
        <EmptyState title="No hay clientes activos para analizar" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {analisis.map((item) => (
            <Card key={item.id}>
              <CardHeader
                title={item.titulo || "Publicación sin título"}
                description={
                  item.ejemplo
                    ? "Publicación de ejemplo · No hay piezas publicadas para este cliente"
                    : "Pieza publicada real · Análisis simulado"
                }
              />
              <CardBody className="space-y-4">
                {!item.ejemplo && (
                  <Link to={`/piezas/${item.id}`} className="text-brand-700 underline">
                    Ver pieza publicada
                  </Link>
                )}
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {(
                    [
                      ["positivo", "Positivo"],
                      ["neutral", "Neutral"],
                      ["negativo", "Negativo"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="bg-surface-muted rounded-lg p-3">
                      <dt className="text-ink-muted text-sm">{label}</dt>
                      <dd className="mt-1 text-xl font-semibold">{item.sentimiento[key]} %</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Temas principales</h3>
                  <ul className="flex flex-wrap gap-2">
                    {item.temas.map((tema) => (
                      <li key={tema} className="bg-surface-muted rounded-full px-3 py-1 text-sm">
                        {tema}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm">{item.resumen}</p>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Comentarios representativos de demostración
                  </h3>
                  <ul className="space-y-2">
                    {item.comentarios.map((comment) => (
                      <li key={comment}>
                        <blockquote className="border-line text-ink-muted border-l-2 pl-3 text-sm">
                          “{comment}”
                        </blockquote>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
