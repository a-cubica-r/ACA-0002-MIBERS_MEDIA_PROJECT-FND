import { Form, Link } from "react-router";
import type { Route } from "./+types/historial";
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
  TBody,
  TD,
  TH,
  THead,
  TR,
  type BadgeTone,
} from "~/components/ui";
import { listAcciones, listAuditoria, type RegistroAuditoria } from "~/lib/api/auditoria";
import { listUsuarios } from "~/lib/api/usuarios";
import type { Usuario } from "~/lib/api/types";
import { requireAdmin } from "~/lib/auth/guards";
import { formatDateTime, fullName } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Historial · Mibers" }];

function parsePage(value: string | null): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAdmin(request);
  const query = new URL(request.url).searchParams;
  const page = parsePage(query.get("page"));
  const actor = query.get("actor") ?? "";
  const action = query.get("action") ?? "";
  const desde = query.get("desde") ?? "";
  const hasta = query.get("hasta") ?? "";
  const [registros, acciones, usuarios] = await Promise.all([
    listAuditoria({ page, actor, action, desde, hasta }),
    listAcciones(),
    listUsuarios(),
  ]);
  return { registros, acciones, usuarios, filtros: { page, actor, action, desde, hasta } };
}

function toneFor(action: string): BadgeTone {
  const value = action.toUpperCase();
  if (["FAILED", "BLOCKED", "LOCKED"].some((token) => value.includes(token))) return "danger";
  if (["APPROVED", "PUBLISHED", "CREATED"].some((token) => value.includes(token))) return "success";
  return "neutral";
}

function Detalle({ registro }: { registro: RegistroAuditoria }) {
  const hasMetadata = Object.keys(registro.metadata).length > 0;
  return (
    <div className="space-y-1">
      <p className="text-ink">{registro.entity_type || "Sin entidad"}</p>
      {hasMetadata && (
        <details>
          <summary className="text-brand-700 cursor-pointer text-sm">Ver datos</summary>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(registro.metadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function Persona({ registro }: { registro: RegistroAuditoria }) {
  return <span>{registro.actor_username || "Sistema"}</span>;
}

function Ip({ registro }: { registro: RegistroAuditoria }) {
  return <span>{registro.ip_address || "Sin IP"}</span>;
}

function Accion({ registro }: { registro: RegistroAuditoria }) {
  return <Badge tone={toneFor(registro.action)}>{registro.action_label}</Badge>;
}

function OpcionesPersona({ usuarios }: { usuarios: Usuario[] }) {
  return (
    <>
      <option value="">Todas</option>
      {usuarios.map((usuario) => (
        <option key={usuario.id} value={usuario.id}>
          {fullName(usuario)}
        </option>
      ))}
    </>
  );
}

export default function HistorialPage({ loaderData }: Route.ComponentProps) {
  const { registros, acciones, usuarios, filtros } = loaderData;
  const formKey = new URLSearchParams({
    actor: filtros.actor,
    action: filtros.action,
    desde: filtros.desde,
    hasta: filtros.hasta,
  }).toString();
  const hrefFor = (next: number) => {
    const params = new URLSearchParams({ page: String(next) });
    if (filtros.actor) params.set("actor", filtros.actor);
    if (filtros.action) params.set("action", filtros.action);
    if (filtros.desde) params.set("desde", filtros.desde);
    if (filtros.hasta) params.set("hasta", filtros.hasta);
    return `?${params}`;
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Historial de acciones"
        description="Quién hizo cada acción y cuándo. El registro no se puede modificar y se conserva 12 meses."
      />

      <Card>
        <CardBody>
          <Form
            method="get"
            key={formKey}
            className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Field label="Persona" htmlFor="actor">
              <Select id="actor" name="actor" defaultValue={filtros.actor}>
                <OpcionesPersona usuarios={usuarios} />
              </Select>
            </Field>
            <Field label="Acción" htmlFor="action">
              <Select id="action" name="action" defaultValue={filtros.action}>
                <option value="">Todas</option>
                {acciones.map((accion) => (
                  <option key={accion.value} value={accion.value}>
                    {accion.label}
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
              <Link to="/historial" className={buttonClasses({ variant: "secondary" })}>
                Limpiar
              </Link>
            </div>
          </Form>
        </CardBody>
      </Card>

      {registros.results.length === 0 ? (
        <EmptyState title="Sin registros para estos filtros" />
      ) : (
        <>
          <p className="text-ink-muted text-sm">{registros.count} registros</p>
          <div className="hidden md:block">
            <Table>
              <THead>
                <TR>
                  <TH>Fecha y hora</TH>
                  <TH>Persona</TH>
                  <TH>Acción</TH>
                  <TH>Detalle</TH>
                  <TH>IP</TH>
                </TR>
              </THead>
              <TBody>
                {registros.results.map((registro) => (
                  <TR key={registro.id}>
                    <TD className="whitespace-nowrap">{formatDateTime(registro.created_at)}</TD>
                    <TD>
                      <Persona registro={registro} />
                    </TD>
                    <TD>
                      <Accion registro={registro} />
                    </TD>
                    <TD>
                      <Detalle registro={registro} />
                    </TD>
                    <TD>
                      <Ip registro={registro} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
            {registros.results.map((registro) => (
              <Card key={registro.id}>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-ink text-sm font-medium">
                      {formatDateTime(registro.created_at)}
                    </p>
                    <Accion registro={registro} />
                  </div>
                  <p className="text-ink-muted text-sm">
                    Persona: <Persona registro={registro} />
                  </p>
                  <Detalle registro={registro} />
                  <p className="text-ink-muted text-xs">
                    IP: <Ip registro={registro} />
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      <Pagination page={filtros.page} pageSize={25} count={registros.count} hrefFor={hrefFor} />
    </div>
  );
}
