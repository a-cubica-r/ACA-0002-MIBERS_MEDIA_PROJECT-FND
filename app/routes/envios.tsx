import { Form, Link } from "react-router";
import type { Route } from "./+types/envios";
import {
  Alert,
  Button,
  buttonClasses,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Pagination,
  Select,
} from "~/components/ui";
import { EnviosTable } from "~/features/envios/envios-table";
import { ESTADOS_ENVIO, filtrosHref, parseFiltros } from "~/features/envios/filtros";
import { listClientes } from "~/lib/api/clientes";
import { ENVIOS_PAGE_SIZE, listEnvios } from "~/lib/api/envios";
import { ApiError } from "~/lib/api/errors";
import type { Cliente } from "~/lib/api/types";
import { requireUser } from "~/lib/auth/guards";
import { ESTADO_ENVIO_LABEL } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Envíos al cliente · Mibers" }];

async function todosLosClientes(): Promise<Cliente[]> {
  const clientes: Cliente[] = [];
  for (let page = 1; ; page++) {
    const response = await listClientes({ page, pageSize: 100 });
    clientes.push(...response.results);
    if (!response.next) return clientes;
  }
}

async function settle<T>(promise: Promise<T>) {
  try {
    return { value: await promise, error: null };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { value: null, error: error.message };
  }
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const filtros = parseFiltros(new URL(request.url).searchParams);
  const [envios, clientes] = await Promise.all([
    settle(listEnvios(filtros)),
    settle(todosLosClientes()),
  ]);
  return { envios: envios.value, error: envios.error, clientes: clientes.value ?? [], filtros };
}

export default function EnviosPage({ loaderData }: Route.ComponentProps) {
  const { envios, clientes, filtros, error } = loaderData;
  const formKey = filtrosHref(filtros, 1);
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Envíos al cliente"
        description="Registro de las piezas enviadas por WhatsApp a los contactos autorizados de cada cliente."
      />
      <Card>
        <CardBody>
          <Form
            method="get"
            key={formKey}
            className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Field label="Cliente" htmlFor="cliente">
              <Select id="cliente" name="cliente" defaultValue={filtros.cliente}>
                <option value="">Todos</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Estado" htmlFor="estado">
              <Select id="estado" name="estado" defaultValue={filtros.estado}>
                <option value="">Todos</option>
                {ESTADOS_ENVIO.map((estado) => (
                  <option key={estado} value={estado}>
                    {ESTADO_ENVIO_LABEL[estado]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Desde" htmlFor="desde">
              <Input id="desde" name="desde" type="date" defaultValue={filtros.desde} />
            </Field>
            <Field label="Hasta" htmlFor="hasta">
              <Input id="hasta" name="hasta" type="date" defaultValue={filtros.hasta} />
            </Field>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
              <Button type="submit">Filtrar</Button>
              <Link to="/envios" className={buttonClasses({ variant: "secondary" })}>
                Limpiar
              </Link>
            </div>
          </Form>
        </CardBody>
      </Card>
      {!envios ? (
        <Alert tone="danger" title="No se pudo cargar el registro de envíos">
          {error}
        </Alert>
      ) : envios.results.length === 0 ? (
        <EmptyState
          title="Sin envíos para estos filtros"
          description="Los envíos aparecen cuando una pieza publicada se comparte con el cliente."
        />
      ) : (
        <>
          <p className="text-ink-muted text-sm">{envios.count} envíos</p>
          <EnviosTable envios={envios.results} />
          <Pagination
            page={filtros.page}
            pageSize={ENVIOS_PAGE_SIZE}
            count={envios.count}
            hrefFor={(next) => filtrosHref(filtros, next)}
          />
        </>
      )}
    </div>
  );
}
