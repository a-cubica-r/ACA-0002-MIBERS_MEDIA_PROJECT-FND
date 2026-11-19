import { Form, Link, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/clientes.lista";
import { listClientes } from "~/lib/api/clientes";
import type { Cliente, Estrategia } from "~/lib/api/types";
import { requireUser } from "~/lib/auth/guards";
import { ESTRATEGIA_LABEL, ESTADO_CUENTA_LABEL, RED_LABEL, formatDate } from "~/lib/format";
import {
  Badge,
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
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "~/components/ui";
export const meta = () => [{ title: "Clientes · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const query = new URL(request.url).searchParams;
  const estrategia = query.get("estrategia");
  const page = Math.max(1, Number.parseInt(query.get("page") ?? "1", 10) || 1);
  return {
    clientes: await listClientes({
      activo: query.get("activo") === "todos" ? undefined : query.get("activo") !== "false",
      estrategia:
        estrategia && Object.hasOwn(ESTRATEGIA_LABEL, estrategia)
          ? (estrategia as Estrategia)
          : undefined,
      search: query.get("search") ?? "",
      page,
      pageSize: 25,
    }),
    page,
  };
}
function Redes({ cliente }: { cliente: Cliente }) {
  return (
    <div className="flex flex-wrap gap-1">
      {cliente.cuentas.length ? (
        cliente.cuentas.map((cuenta) => (
          <Badge
            key={cuenta.id}
            tone={
              cuenta.estado === "VINCULADA"
                ? "success"
                : cuenta.estado === "EXPIRADA"
                  ? "warning"
                  : "danger"
            }
          >
            {RED_LABEL[cuenta.red]} · {ESTADO_CUENTA_LABEL[cuenta.estado]}
          </Badge>
        ))
      ) : (
        <span className="text-ink-muted">Sin redes</span>
      )}
    </div>
  );
}
function Contactos({ cliente }: { cliente: Cliente }) {
  return (
    <>
      {cliente.contactos_whatsapp.filter((contacto) => contacto.autorizado).length} autorizados /{" "}
      {cliente.contactos_whatsapp.length}
    </>
  );
}
function Contrato({ cliente }: { cliente: Cliente }) {
  return (
    <>
      {formatDate(cliente.contrato_inicio)} –{" "}
      {cliente.contrato_fin ? formatDate(cliente.contrato_fin) : "Sin fecha fin"}
    </>
  );
}
export default function ClientesLista() {
  const { clientes, page } = useLoaderData<typeof clientLoader>();
  const [query] = useSearchParams();
  const hrefFor = (next: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(next));
    return `?${params}`;
  };
  const newAction = (
    <Link to="/clientes/nuevo" className={buttonClasses()}>
      Nuevo cliente
    </Link>
  );
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Clientes"
        description="La información de cada empresa, en un solo lugar."
        actions={newAction}
      />
      <Card>
        <CardBody>
          <Form
            method="get"
            className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"
            key={query.toString()}
          >
            <Field label="Buscar por nombre" htmlFor="search">
              <Input
                id="search"
                name="search"
                type="search"
                placeholder="Nombre de la empresa"
                defaultValue={query.get("search") ?? ""}
              />
            </Field>
            <Field label="Estado" htmlFor="activo">
              <Select id="activo" name="activo" defaultValue={query.get("activo") ?? "true"}>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
                <option value="todos">Todos</option>
              </Select>
            </Field>
            <Field label="Estrategia" htmlFor="estrategia">
              <Select
                id="estrategia"
                name="estrategia"
                defaultValue={query.get("estrategia") ?? ""}
              >
                <option value="">Todas</option>
                {Object.entries(ESTRATEGIA_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Filtrar</Button>
          </Form>
        </CardBody>
      </Card>
      {!clientes.results.length ? (
        <EmptyState
          title="No hay clientes para estos filtros"
          description="Puedes ajustar la búsqueda o registrar una nueva empresa."
          action={newAction}
        />
      ) : (
        <>
          <Table containerClassName="hidden lg:block">
            <THead>
              <TR>
                {[
                  "Nombre",
                  "Estrategia",
                  "Plan",
                  "Contrato",
                  "Redes",
                  "Contactos WhatsApp",
                  "Estado",
                ].map((label) => (
                  <TH key={label}>{label}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {clientes.results.map((cliente) => (
                <TR key={cliente.id}>
                  <TD>
                    <Link
                      className="text-brand-700 font-medium hover:underline"
                      to={`/clientes/${cliente.id}`}
                    >
                      {cliente.nombre}
                    </Link>
                  </TD>
                  <TD>
                    <Badge tone="brand">{ESTRATEGIA_LABEL[cliente.estrategia]}</Badge>
                  </TD>
                  <TD>{cliente.posts_por_semana} posts/semana</TD>
                  <TD>
                    <Contrato cliente={cliente} />
                  </TD>
                  <TD>
                    <Redes cliente={cliente} />
                  </TD>
                  <TD>
                    <Contactos cliente={cliente} />
                  </TD>
                  <TD>
                    <Badge tone={cliente.activo ? "success" : "neutral"}>
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {clientes.results.map((cliente) => (
              <Card key={cliente.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      className="text-brand-700 min-w-0 font-semibold break-words hover:underline"
                      to={`/clientes/${cliente.id}`}
                    >
                      {cliente.nombre}
                    </Link>
                    <Badge tone={cliente.activo ? "success" : "neutral"}>
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <Badge tone="brand">{ESTRATEGIA_LABEL[cliente.estrategia]}</Badge>
                  <p className="text-sm">{cliente.posts_por_semana} posts/semana</p>
                  <p className="text-ink-muted text-sm">
                    <Contrato cliente={cliente} />
                  </p>
                  <Redes cliente={cliente} />
                  <p className="text-sm">
                    WhatsApp: <Contactos cliente={cliente} />
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
      <Pagination page={page} pageSize={25} count={clientes.count} hrefFor={hrefFor} />
    </div>
  );
}
