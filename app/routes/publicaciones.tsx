import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/publicaciones";
import { buttonClasses, PageHeader, Pagination } from "~/components/ui";
import { TaskCard } from "~/features/publicaciones/task-card";
import { isPublicationUrl } from "~/features/publicaciones/validation";
import { ApiError } from "~/lib/api/errors";
import {
  confirmarPublicacion,
  fallarPublicacion,
  listPublicaciones,
  reintentarPublicacion,
  type EstadoPublicacion,
} from "~/lib/api/publicaciones";
import { requireUser } from "~/lib/auth/guards";

export const meta: Route.MetaFunction = () => [{ title: "Publicaciones | Mibers" }];
const filters = [
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "PUBLICADA", label: "Publicadas" },
  { value: "FALLIDA", label: "Fallidas" },
  { value: "CANCELADA", label: "Canceladas" },
  { value: "TODAS", label: "Todas" },
];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  const query = new URL(request.url).searchParams;
  const estado = filters.some((filter) => filter.value === query.get("estado"))
    ? query.get("estado")!
    : "PENDIENTE";
  const rawPage = Number(query.get("page") ?? 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const tasks = await listPublicaciones(
    estado === "TODAS" ? undefined : (estado as EstadoPublicacion),
    page,
  );
  return { tasks, estado, page, now: Date.now() };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  await requireUser(request);
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const intent = form.get("intent");
  if (!id) return { ok: false as const, error: "Falta la tarea de publicación." };
  try {
    if (intent === "confirmar") {
      const enlace = String(form.get("enlace") ?? "").trim();
      if (!isPublicationUrl(enlace))
        return {
          ok: false as const,
          error: "Ingresa una URL HTTP o HTTPS válida de la publicación (máximo 500 caracteres).",
        };
      await confirmarPublicacion(id, enlace);
    } else if (intent === "fallar") {
      const motivo = String(form.get("motivo") ?? "").trim();
      if (!motivo) return { ok: false as const, error: "Escribe el motivo del fallo." };
      await fallarPublicacion(id, motivo);
    } else if (intent === "reintentar") await reintentarPublicacion(id);
    else return { ok: false as const, error: "Acción no válida." };
    return { ok: true as const };
  } catch (e) {
    if (e instanceof ApiError)
      return {
        ok: false as const,
        error: [e.message, ...Object.values(e.fieldErrors)].join(" "),
        fieldErrors: e.fieldErrors,
      };
    throw e;
  }
}
export default function PublicacionesPage({ loaderData }: Route.ComponentProps) {
  const { tasks, estado, page, now } = loaderData;
  const [query] = useSearchParams();
  function pageHref(nextPage: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(nextPage));
    return `?${next}`;
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Publicaciones"
        description="Publica en la cuenta del cliente y confirma con el enlace. Si ocurre un problema, reporta el motivo para poder reintentar. Horarios de Colombia."
      />
      <nav aria-label="Estado de publicaciones" className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            to={`?estado=${filter.value}`}
            aria-current={estado === filter.value ? "page" : undefined}
            className={buttonClasses({
              variant: estado === filter.value ? "primary" : "secondary",
              size: "sm",
            })}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      {tasks.results.length ? (
        <div className="space-y-4">
          {tasks.results.map((task) => (
            <TaskCard key={task.id} task={task} now={now} />
          ))}
        </div>
      ) : (
        <div className="bg-surface border-line rounded-xl border p-8 text-center">
          <p className="font-medium">No hay tareas en este estado.</p>
          <p className="text-ink-muted mt-2 text-sm">
            Las tareas se generan cuando llega la hora de una pieza programada.
          </p>
        </div>
      )}
      <Pagination page={page} pageSize={25} count={tasks.count} hrefFor={pageHref} />
    </div>
  );
}
