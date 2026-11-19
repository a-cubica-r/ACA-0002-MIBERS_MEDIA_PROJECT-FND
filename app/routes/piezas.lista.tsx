import { Form, Link } from "react-router";
import type { Route } from "./+types/piezas.lista";
import { listPiezas, type PiezaFilters } from "~/lib/api/piezas";
import { requireUser } from "~/lib/auth/guards";
import { loadClientes } from "~/features/piezas/form-data";
import { EstadoPiezaBadge, RedChip } from "~/features/contenido/badges";
import { ESTADO_PIEZA_LABEL, TIPO_PIEZA_LABEL, formatDateTime } from "~/lib/format";
import { NETWORKS, TYPES } from "~/features/piezas/schemas";
import {
  PageHeader,
  Button,
  Input,
  Select,
  Field,
  Pagination,
  buttonClasses,
} from "~/components/ui";
export const meta = () => [{ title: "Piezas · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const query = new URL(request.url).searchParams;
  const filters: PiezaFilters = {};
  for (const key of ["cliente", "estado", "tipo", "red", "desde", "hasta", "search"] as const)
    filters[key] = query.get(key) ?? "";
  const page = Math.max(1, Number(query.get("page")) || 1);
  const [piezas, clientes] = await Promise.all([listPiezas({ ...filters, page }), loadClientes()]);
  return { piezas, clientes, filters, page };
}
export default function Lista({
  loaderData: { piezas, clientes, filters, page },
}: Route.ComponentProps) {
  const href = (patch: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...patch }))
      if (value) query.set(key, String(value));
    return `/piezas?${query}`;
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Piezas"
        description="Contenido, revisión y programación en un solo lugar."
        actions={
          <Link
            className={buttonClasses({})}
            to={`/piezas/nueva${filters.cliente ? `?cliente=${filters.cliente}` : ""}`}
          >
            Nueva pieza
          </Link>
        }
      />
      <div className="flex flex-wrap gap-2">
        {Object.entries(ESTADO_PIEZA_LABEL).map(([estado, label]) => (
          <Link
            key={estado}
            aria-current={filters.estado === estado ? "page" : undefined}
            className={buttonClasses({
              variant: filters.estado === estado ? "primary" : "secondary",
              size: "sm",
            })}
            to={href({ estado, page: "" })}
          >
            {label}
          </Link>
        ))}
        <Link
          className={buttonClasses({
            variant: filters.tipo === "HISTORIA" ? "primary" : "secondary",
            size: "sm",
          })}
          to={href({ tipo: "HISTORIA", page: "" })}
        >
          Historias
        </Link>
        <Link className={buttonClasses({ variant: "ghost", size: "sm" })} to="/piezas">
          Limpiar filtros
        </Link>
      </div>
      <Form
        method="get"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        key={JSON.stringify(filters)}
      >
        <Field label="Cliente" htmlFor="f-cliente">
          <Select id="f-cliente" name="cliente" defaultValue={filters.cliente}>
            <option value="">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado" htmlFor="f-estado">
          <Select id="f-estado" name="estado" defaultValue={filters.estado}>
            <option value="">Todos</option>
            {Object.entries(ESTADO_PIEZA_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo" htmlFor="f-tipo">
          <Select id="f-tipo" name="tipo" defaultValue={filters.tipo}>
            <option value="">Todos</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TIPO_PIEZA_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Red" htmlFor="f-red">
          <Select id="f-red" name="red" defaultValue={filters.red}>
            <option value="">Todas</option>
            {NETWORKS.map((r) => (
              <option key={r} value={r}>
                {r === "INSTAGRAM" ? "Instagram" : "Facebook"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Desde" htmlFor="f-desde">
          <Input type="date" id="f-desde" name="desde" defaultValue={filters.desde} />
        </Field>
        <Field label="Hasta" htmlFor="f-hasta">
          <Input type="date" id="f-hasta" name="hasta" defaultValue={filters.hasta} />
        </Field>
        <Field label="Buscar título" htmlFor="f-search">
          <Input id="f-search" name="search" defaultValue={filters.search} />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Filtrar</Button>
        </div>
      </Form>
      <div className="border-line bg-surface overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted">
            <tr>
              {["Pieza / cliente", "Tipo / redes", "Fecha (Colombia)", "Estado", "Responsable"].map(
                (h) => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {piezas.results.map((p) => (
              <tr key={p.id} className="border-line border-t">
                <td className="p-3">
                  <Link className="text-brand-700 font-medium underline" to={`/piezas/${p.id}`}>
                    {p.titulo || "Sin título"}
                  </Link>
                  <p className="text-ink-muted">{p.cliente_nombre}</p>
                </td>
                <td className="p-3">
                  {TIPO_PIEZA_LABEL[p.tipo]}
                  <div className="flex flex-wrap gap-1">
                    {p.redes.map((r) => (
                      <RedChip key={r} red={r} />
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  {p.programada_para ? formatDateTime(p.programada_para) : "Sin fecha"}
                </td>
                <td className="p-3">
                  <EstadoPiezaBadge estado={p.estado} />
                </td>
                <td className="p-3">{p.responsable_username || "Sin asignar"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!piezas.count && <p className="text-ink-muted p-6">No hay piezas con estos filtros.</p>}
      </div>
      <Pagination
        page={page}
        pageSize={25}
        count={piezas.count}
        hrefFor={(p) => href({ page: String(p) })}
      />
    </div>
  );
}
