import { useState } from "react";
import { Link, useFetcher, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/tareas";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
} from "~/components/ui";
import {
  createTarea,
  ESTADOS,
  ESTADO_LABEL,
  initializeTareas,
  listPersonas,
  listTareas,
  updateTarea,
  type Tarea,
  type TareaInput,
} from "~/lib/api/tareas";
import { ApiError } from "~/lib/api/errors";
import { requireUser } from "~/lib/auth/guards";
import { useCurrentUser } from "~/lib/auth/use-current-user";
import { formatDate } from "~/lib/format";
import { clientesTareas, piezasTareas } from "~/features/tareas/data";
import { esVencida, filtrarTareas } from "~/features/tareas/metricas-equipo";
import { MockNotice } from "~/features/tareas/mock-notice";
import { useLiveTareas } from "~/features/tareas/use-live-tareas";
export const meta = () => [{ title: "Tareas · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireUser(request);
  const [clientes, piezas] = await Promise.all([clientesTareas(), piezasTareas()]);
  await initializeTareas(user, clientes);
  const [tareas, personas] = await Promise.all([listTareas(), listPersonas()]);
  return { tareas, personas, clientes, piezas };
}
export async function clientAction({ request }: Route.ClientActionArgs) {
  const user = await requireUser(request);
  const form = await request.formData();
  const value = (key: string) => String(form.get(key) ?? "");
  try {
    const intent = value("intent");
    if (intent === "estado") {
      const estado = value("estado");
      if (!ESTADOS.includes(estado as Tarea["estado"]))
        throw new ApiError(400, { detail: "Estado inválido." });
      await updateTarea(value("id"), { estado: estado as Tarea["estado"] }, user);
    } else if (intent === "crear" || intent === "editar") {
      const [clientes, piezas, personas] = await Promise.all([
        clientesTareas(),
        piezasTareas(value("cliente_id")),
        listPersonas(),
      ]);
      const persona = personas.find((p) => p.id === value("asignado_a"));
      const pieza = value("pieza_id");
      if (
        !persona ||
        !clientes.some((c) => c.id === value("cliente_id")) ||
        (pieza && !piezas.some((p) => p.id === pieza && p.cliente === value("cliente_id")))
      )
        throw new ApiError(400, {
          detail: "Selecciona un cliente, una persona y una pieza del mismo cliente válidos.",
        });
      const input: TareaInput = {
        titulo: value("titulo"),
        descripcion: value("descripcion"),
        cliente_id: value("cliente_id"),
        pieza_id: pieza || null,
        asignado_a: persona,
        fecha_limite: value("fecha_limite"),
        prioridad: value("prioridad") as Tarea["prioridad"],
        estado: value("estado") as Tarea["estado"],
      };
      if (intent === "crear") await createTarea(input, user);
      else await updateTarea(value("id"), input, user);
    } else throw new ApiError(400, { detail: "Acción inválida." });
    return { ok: true, error: null };
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}
export default function Tareas() {
  const { tareas, personas, clientes, piezas } = useLoaderData<typeof clientLoader>();
  const user = useCurrentUser();
  useLiveTareas();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Tarea | "nueva" | null>(null);
  const [vista, setVista] = useState("tablero");
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const visibles = filtrarTareas(tareas, {
    propias: params.get("ambito") === "mias" ? user.id : undefined,
    cliente: params.get("cliente") ?? "",
    persona: params.get("persona") ?? "",
    vencidas: params.get("vencidas") === "si",
    tarea: params.get("tarea") ?? "",
  });
  const fetcher = useFetcher<typeof clientAction>();
  const renderTarea = (t: Tarea) => (
    <Card key={t.id} id={`tarea-${t.id}`} className={esVencida(t) ? "border-danger-600" : ""}>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap justify-between gap-2">
          <h3 className="font-semibold break-words">{t.titulo}</h3>
          <span className="text-ink-muted text-xs">Prioridad {t.prioridad.toLowerCase()}</span>
        </div>
        <p className="text-ink-muted text-sm">
          {clientes.find((c) => c.id === t.cliente_id)?.nombre ?? "Cliente no disponible"} ·{" "}
          {t.asignado_a.nombre}
        </p>
        {t.descripcion && (
          <p className="text-sm break-words whitespace-pre-wrap">{t.descripcion}</p>
        )}
        <p
          className={`text-sm ${esVencida(t) ? "text-danger-700 font-semibold" : "text-ink-muted"}`}
        >
          {esVencida(t) ? "Vencida · " : "Plazo · "}
          {formatDate(t.fecha_limite)}
        </p>
        {t.pieza_id && (
          <Link className="text-brand-700 text-sm underline" to={`/piezas/${t.pieza_id}`}>
            Ver pieza vinculada
          </Link>
        )}
        <p className="text-ink-muted text-xs">{ESTADO_LABEL[t.estado]}</p>
        {(user.role === "ADMIN" || t.asignado_a.id === user.id) && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>
              Editar tarea
            </Button>
            <label className="sr-only" htmlFor={`estado-${t.id}`}>
              Estado de {t.titulo}
            </label>
            <Select
              id={`estado-${t.id}`}
              className="min-w-0 flex-1"
              value={t.estado}
              disabled={fetcher.state !== "idle"}
              onChange={(e) =>
                fetcher.submit(
                  { intent: "estado", id: t.id, estado: e.target.value },
                  { method: "post" },
                )
              }
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
        )}
      </CardBody>
    </Card>
  );
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Tareas del equipo"
        description="Organiza la elaboración de contenido por persona y cliente."
        actions={<Button onClick={() => setEditing("nueva")}>Crear tarea</Button>}
      />
      <MockNotice />
      {fetcher.data?.error && <Alert tone="danger">{fetcher.data.error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Mostrar" htmlFor="ambito">
          <Select
            id="ambito"
            value={params.get("ambito") ?? ""}
            onChange={(e) => filter("ambito", e.target.value)}
          >
            <option value="">Todas las tareas</option>
            <option value="mias">Mis tareas</option>
          </Select>
        </Field>
        <Field label="Cliente" htmlFor="f-cliente">
          <Select
            id="f-cliente"
            value={params.get("cliente") ?? ""}
            onChange={(e) => filter("cliente", e.target.value)}
          >
            <option value="">Todos los clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Persona" htmlFor="persona">
          <Select
            id="persona"
            value={params.get("persona") ?? ""}
            onChange={(e) => filter("persona", e.target.value)}
          >
            <option value="">Todas las personas</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Plazo" htmlFor="vencidas">
          <Select
            id="vencidas"
            value={params.get("vencidas") ?? ""}
            onChange={(e) => filter("vencidas", e.target.value)}
          >
            <option value="">Todos los plazos</option>
            <option value="si">Solo vencidas</option>
          </Select>
        </Field>
        <Field label="Vista" htmlFor="vista">
          <Select id="vista" value={vista} onChange={(e) => setVista(e.target.value)}>
            <option value="tablero">Tablero</option>
            <option value="lista">Lista</option>
          </Select>
        </Field>
      </div>
      {params.has("tarea") && (
        <Link className="text-brand-700 underline" to="/tareas">
          Ver todas las tareas
        </Link>
      )}
      {!visibles.length && <p className="text-ink-muted">No hay tareas con estos filtros.</p>}
      {vista === "lista" ? (
        <div className="grid gap-4 md:grid-cols-2">{visibles.map(renderTarea)}</div>
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ESTADOS.map((estado) => (
            <section key={estado} className="bg-surface-muted min-w-0 space-y-3 rounded-xl p-3">
              <h2 className="font-semibold">
                {ESTADO_LABEL[estado]}{" "}
                <span className="text-ink-muted">
                  ({visibles.filter((t) => t.estado === estado).length})
                </span>
              </h2>
              {visibles.filter((t) => t.estado === estado).map(renderTarea)}
            </section>
          ))}
        </div>
      )}
      {editing && (
        <TareaModal
          key={editing === "nueva" ? "nueva" : editing.id}
          tarea={editing === "nueva" ? null : editing}
          clientes={clientes}
          personas={personas}
          piezas={piezas}
          user={user}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
function TareaModal({
  tarea,
  clientes,
  personas,
  piezas,
  user,
  onClose,
}: {
  tarea: Tarea | null;
  clientes: Awaited<ReturnType<typeof clientesTareas>>;
  personas: Awaited<ReturnType<typeof listPersonas>>;
  piezas: Awaited<ReturnType<typeof piezasTareas>>;
  user: ReturnType<typeof useCurrentUser>;
  onClose: () => void;
}) {
  const fetcher = useFetcher<typeof clientAction>();
  const [cliente, setCliente] = useState(tarea?.cliente_id ?? clientes[0]?.id ?? "");
  const [pieza, setPieza] = useState(tarea?.pieza_id ?? "");
  const success = fetcher.state === "idle" && fetcher.data?.ok;
  return (
    <Modal open onClose={onClose} title={tarea ? "Editar tarea" : "Crear tarea"}>
      {success ? (
        <div className="space-y-4">
          <Alert tone="success">Tarea guardada.</Alert>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <fetcher.Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value={tarea ? "editar" : "crear"} />
          <input type="hidden" name="id" value={tarea?.id ?? ""} />
          {fetcher.data?.error && <Alert tone="danger">{fetcher.data.error}</Alert>}
          <Field label="Título" htmlFor="titulo" required>
            <Input
              id="titulo"
              name="titulo"
              required
              maxLength={200}
              defaultValue={tarea?.titulo}
            />
          </Field>
          <Field label="Descripción" htmlFor="descripcion">
            <textarea
              id="descripcion"
              name="descripcion"
              maxLength={5000}
              defaultValue={tarea?.descripcion}
              className="border-line bg-surface w-full rounded-lg border p-2"
            />
          </Field>
          <Field label="Cliente" htmlFor="cliente_id" required>
            <Select
              id="cliente_id"
              name="cliente_id"
              required
              value={cliente}
              onChange={(e) => {
                setCliente(e.target.value);
                setPieza("");
              }}
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pieza (opcional)" htmlFor="pieza_id">
            <Select
              id="pieza_id"
              name="pieza_id"
              value={pieza}
              onChange={(e) => setPieza(e.target.value)}
            >
              <option value="">Sin pieza vinculada</option>
              {piezas
                .filter((p) => p.cliente === cliente)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Asignar a" htmlFor="asignado_a" required>
            <Select
              id="asignado_a"
              name="asignado_a"
              required
              defaultValue={tarea?.asignado_a.id ?? user.id}
            >
              {personas
                .filter((p) => !tarea || user.role === "ADMIN" || p.id === user.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Fecha límite" htmlFor="fecha_limite" required>
            <Input
              id="fecha_limite"
              name="fecha_limite"
              type="date"
              required
              defaultValue={tarea?.fecha_limite}
            />
          </Field>
          <Field label="Prioridad" htmlFor="prioridad">
            <Select id="prioridad" name="prioridad" defaultValue={tarea?.prioridad ?? "MEDIA"}>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </Select>
          </Field>
          <Field label="Estado" htmlFor="estado">
            <Select id="estado" name="estado" defaultValue={tarea?.estado ?? "PENDIENTE"}>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" loading={fetcher.state !== "idle"}>
            Guardar tarea
          </Button>
        </fetcher.Form>
      )}
    </Modal>
  );
}
