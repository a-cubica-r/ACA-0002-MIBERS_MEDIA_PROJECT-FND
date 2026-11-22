import clsx from "clsx";
import { Link, useFetcher } from "react-router";
import type { Route } from "./+types/alertas";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  Pagination,
} from "~/components/ui";
import { listAlertas, marcarAlertaLeida, type Alerta, type TipoAlerta } from "~/lib/api/alertas";
import { isApiError } from "~/lib/api/errors";
import { requireAdmin } from "~/lib/auth/guards";
import { formatDateTime } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Alertas · Mibers" }];

type Estado = "no-leidas" | "leidas" | "todas";
type Tone = "danger" | "warning" | "info";

const TABS: { estado: Estado; label: string }[] = [
  { estado: "no-leidas", label: "No leídas" },
  { estado: "leidas", label: "Leídas" },
  { estado: "todas", label: "Todas" },
];

const TIPO_TONE: Record<TipoAlerta, Tone> = {
  PUBLICACION_FALLIDA: "danger",
  PUBLICACION_BLOQUEADA: "danger",
  ENVIO_CLIENTE_FALLIDO: "danger",
  PUBLICACION_ATRASADA: "warning",
  CUENTA_EXPIRADA: "warning",
  CUENTA_DESVINCULADA: "info",
};

const TONE_DOT: Record<Tone, string> = {
  danger: "bg-danger-600",
  warning: "bg-warning-700",
  info: "bg-info-700",
};

function parseEstado(value: string | null): Estado {
  return value === "leidas" || value === "todas" ? value : "no-leidas";
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAdmin(request);
  const query = new URL(request.url).searchParams;
  const estado = parseEstado(query.get("estado"));
  const page = Math.max(1, Number.parseInt(query.get("page") ?? "1", 10) || 1);
  const alertas = await listAlertas({
    leida: estado === "todas" ? undefined : estado === "leidas",
    page,
  });
  return { alertas, estado, page };
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  try {
    if (intent === "leer") {
      const id = form.get("id");
      if (typeof id !== "string" || !id)
        return { ok: false, error: "Selecciona una alerta válida." };
      await marcarAlertaLeida(id);
      return { ok: true };
    }
    if (intent === "leer-todas") {
      // Recorre todas las paginas de no leidas, no solo la visible.
      for (let guard = 0; guard < 40; guard++) {
        const { results } = await listAlertas({ leida: false, page: 1 });
        if (results.length === 0) break;
        await Promise.all(results.map((alerta) => marcarAlertaLeida(alerta.id)));
      }
      return { ok: true };
    }
    return { ok: false, error: "Acción inválida." };
  } catch (error) {
    if (isApiError(error)) return { ok: false, error: error.message };
    throw error;
  }
}

const TIPO_LABEL: Record<string, string> = {
  PUBLICACION_FALLIDA: "Publicación fallida",
  PUBLICACION_BLOQUEADA: "Publicación bloqueada por falta de aprobación",
  PUBLICACION_ATRASADA: "Publicación pendiente sin confirmar",
  CUENTA_EXPIRADA: "Cuenta de red expirada",
  CUENTA_DESVINCULADA: "Cuenta de red desvinculada",
  ENVIO_CLIENTE_FALLIDO: "Falló el envío al cliente",
};

function AlertaItem({ alerta }: { alerta: Alerta }) {
  const fetcher = useFetcher<typeof clientAction>();
  const tone = TIPO_TONE[alerta.tipo];
  const entity = alerta.entity_type.toLowerCase();

  return (
    <Card>
      <CardBody className="flex items-start gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className={clsx("mt-2 h-2.5 w-2.5 shrink-0 rounded-full", TONE_DOT[tone])}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={tone}>{TIPO_LABEL[alerta.tipo] ?? alerta.tipo_label}</Badge>
            {!alerta.leida_at && (
              <span className="inline-flex items-center">
                <span aria-hidden="true" className="bg-brand-600 h-2 w-2 rounded-full" />
                <span className="sr-only">No leída</span>
              </span>
            )}
          </div>
          <p className="text-ink text-sm break-words">{alerta.mensaje}</p>
          <p className="text-ink-muted text-xs">{formatDateTime(alerta.created_at)}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {entity.includes("pieza") && (
              <Link
                to={`/piezas/${alerta.entity_id}`}
                className="text-brand-700 text-sm font-medium hover:underline"
              >
                Ver pieza
              </Link>
            )}
            {entity.includes("tareapublicacion") && (
              <Link
                to="/publicaciones?estado=FALLIDA"
                className="text-brand-700 text-sm font-medium hover:underline"
              >
                Ver publicaciones
              </Link>
            )}
            {entity.includes("cuentasocial") && (
              <Link to="/clientes" className="text-brand-700 text-sm font-medium hover:underline">
                Ver clientes
              </Link>
            )}
            {entity.includes("cliente") && (
              <Link
                to={`/clientes/${alerta.entity_id}`}
                className="text-brand-700 text-sm font-medium hover:underline"
              >
                Ver cliente
              </Link>
            )}
            {alerta.leida_at ? (
              <span className="text-ink-muted text-xs">
                Leída el {formatDateTime(alerta.leida_at)}
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                loading={fetcher.state !== "idle"}
                onClick={() =>
                  fetcher.submit({ intent: "leer", id: alerta.id }, { method: "post" })
                }
              >
                Marcar como leída
              </Button>
            )}
          </div>
          {fetcher.data?.error && <Alert tone="danger">{fetcher.data.error}</Alert>}
        </div>
      </CardBody>
    </Card>
  );
}

export default function AlertasPage({ loaderData }: Route.ComponentProps) {
  const { alertas, estado, page } = loaderData;
  const bulk = useFetcher<typeof clientAction>();
  const noLeidas = alertas.results.filter((alerta) => !alerta.leida_at);

  const hrefFor = (next: number) => `?${new URLSearchParams({ estado, page: String(next) })}`;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Alertas"
        description="Fallos, bloqueos y cuentas que requieren tu atención. También llegan a tu WhatsApp."
        actions={
          noLeidas.length ? (
            <Button
              variant="secondary"
              loading={bulk.state !== "idle"}
              onClick={() => {
                const formData = new FormData();
                formData.set("intent", "leer-todas");
                for (const alerta of noLeidas) formData.append("ids", alerta.id);
                bulk.submit(formData, { method: "post" });
              }}
            >
              Marcar todas como leídas
            </Button>
          ) : undefined
        }
      />
      {bulk.data?.error && <Alert tone="danger">{bulk.data.error}</Alert>}
      <nav
        aria-label="Filtrar alertas"
        className="border-line flex max-w-full gap-1 overflow-x-auto border-b"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.estado}
            to={`?estado=${tab.estado}`}
            aria-current={estado === tab.estado ? "page" : undefined}
            className={clsx(
              "shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              estado === tab.estado
                ? "bg-brand-50 text-brand-700"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {alertas.results.length ? (
        <div className="space-y-3">
          {alertas.results.map((alerta) => (
            <AlertaItem key={alerta.id} alerta={alerta} />
          ))}
        </div>
      ) : (
        <EmptyState title="No hay alertas" description="Todo está en orden." />
      )}
      <Pagination page={page} pageSize={25} count={alertas.count} hrefFor={hrefFor} />
    </div>
  );
}
