import { Form, redirect, useNavigation } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/metricas.cargar";
import {
  Alert,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from "~/components/ui";
import { MetricasTabs } from "~/features/metricas/metricas-tabs";
import { metricasClientes } from "~/features/metricas/clientes";
import { currentMonth, METRIC_LABEL } from "~/features/metricas/calculos";
import { allMetricas, METRIC_FIELDS, saveMetricas, type MetricValues } from "~/lib/api/metricas";
import { ApiError } from "~/lib/api/errors";
import { requireUser } from "~/lib/auth/guards";
import { RED_LABEL } from "~/lib/format";
import { parseForm } from "~/lib/validation";
const networks = ["INSTAGRAM", "FACEBOOK"] as const;
const monthPattern = /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/;
const schema = z.object({
  cliente: z.uuid("Selecciona un cliente válido."),
  mes: z
    .string()
    .regex(monthPattern, "Selecciona un mes válido.")
    .refine((value) => value <= currentMonth(), "No se pueden registrar meses futuros."),
});
export const meta: Route.MetaFunction = () => [{ title: "Cargar métricas | Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const query = new URL(request.url).searchParams;
  const selection = await metricasClientes(query);
  const raw = query.get("mes") ?? "";
  const maxMonth = currentMonth();
  const mes = monthPattern.test(raw) && raw <= maxMonth ? raw : maxMonth;
  const rows = selection.cliente
    ? await allMetricas({ cliente: selection.cliente, desde: mes, hasta: mes })
    : [];
  return { ...selection, mes, rows, maxMonth };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireUser(request);
  const form = await request.formData();
  const result = parseForm(schema, form);
  const fieldErrors: Record<string, string> = result.success ? {} : { ...result.fieldErrors };
  const inputs: { red: (typeof networks)[number]; values: MetricValues }[] = [];
  for (const red of networks) {
    const values: MetricValues = {
      alcance: null,
      visualizaciones: null,
      interacciones: null,
      seguidores: null,
    };
    let provided = form.get(`${red}_existente`) === "true";
    for (const field of METRIC_FIELDS) {
      const key = `${red}_${field}`;
      const raw = String(form.get(key) ?? "").trim();
      if (!raw) continue;
      provided = true;
      const number = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(number) || number < 0)
        fieldErrors[key] = "Ingresa un entero mayor o igual a cero dentro del rango permitido.";
      else values[field] = number;
    }
    if (provided) inputs.push({ red, values });
  }
  if (!result.success || Object.keys(fieldErrors).length)
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors };
  if (!inputs.length)
    return { ok: false, error: "Ingresa al menos un indicador para una red.", fieldErrors };
  let saved = 0;
  for (const input of inputs) {
    try {
      await saveMetricas(result.data.cliente, {
        red: input.red,
        mes: result.data.mes,
        ...input.values,
      });
      saved += 1;
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors))
          fieldErrors[
            METRIC_FIELDS.some((name) => name === field) ? `${input.red}_${field}` : field
          ] = message;
        return {
          ok: false,
          error: `${RED_LABEL[input.red]}: ${error.message}${saved ? " La otra red ya se guardó; puedes volver a intentar." : ""}`,
          fieldErrors,
        };
      }
      throw error;
    }
  }
  return redirect(`/metricas?${new URLSearchParams({ cliente: result.data.cliente })}`);
}
export default function CargarMetricasPage({ loaderData, actionData }: Route.ComponentProps) {
  const { cliente, clientes, mes, maxMonth, rows } = loaderData;
  const navigation = useNavigation();
  const fieldError = (key: string) => actionData?.fieldErrors[key];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cargar métricas"
        description="Registra o corrige los indicadores mensuales. Un campo vacío significa que el dato no está disponible; cero significa ausencia de actividad."
      />
      <MetricasTabs cliente={cliente} />
      {!clientes.length ? (
        <EmptyState
          title="No hay clientes activos"
          description="Registra o activa un cliente para cargar sus métricas."
        />
      ) : (
        <>
          <Form method="get" className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              Cliente
              <Select name="cliente" defaultValue={cliente} key={cliente}>
                {clientes.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              Mes
              <Input type="month" name="mes" required defaultValue={mes} key={mes} max={maxMonth} />
            </label>
            <Button
              type="submit"
              variant="secondary"
              className="self-end"
              loading={navigation.state === "loading"}
            >
              Consultar valores existentes
            </Button>
          </Form>
          <Form method="post" key={`${cliente}-${mes}`} className="space-y-6">
            <input type="hidden" name="cliente" value={cliente} />
            <input type="hidden" name="mes" value={mes} />
            <p className="font-medium">
              Editando: {clientes.find((item) => item.id === cliente)?.nombre} · {mes}
            </p>
            {actionData?.error && (
              <Alert tone="danger">
                {actionData.error}
                {["cliente", "mes"].map(
                  (field) => fieldError(field) && <p key={field}>{fieldError(field)}</p>,
                )}
              </Alert>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              {networks.map((red) => {
                const existing = rows.find((row) => row.red === red);
                return (
                  <Card key={red}>
                    <CardBody>
                      <fieldset className="space-y-4">
                        <legend className="mb-4 font-semibold">{RED_LABEL[red]}</legend>
                        <input
                          type="hidden"
                          name={`${red}_existente`}
                          value={existing ? "true" : "false"}
                        />
                        {METRIC_FIELDS.map((field) => {
                          const key = `${red}_${field}`;
                          return (
                            <div key={field}>
                              <label htmlFor={key} className="mb-1 block text-sm">
                                {METRIC_LABEL[field]}{" "}
                                <span className="text-ink-muted">(opcional)</span>
                              </label>
                              <Input
                                id={key}
                                name={key}
                                type="number"
                                min="0"
                                step="1"
                                max={Number.MAX_SAFE_INTEGER}
                                defaultValue={existing?.[field] ?? ""}
                                invalid={!!fieldError(key)}
                                aria-describedby={fieldError(key) ? `${key}-error` : undefined}
                              />
                              {fieldError(key) && (
                                <p
                                  id={`${key}-error`}
                                  role="alert"
                                  className="text-danger-700 mt-1 text-sm"
                                >
                                  {fieldError(key)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </fieldset>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
            <Button type="submit" loading={navigation.state === "submitting"}>
              Guardar métricas
            </Button>
          </Form>
        </>
      )}
    </div>
  );
}
