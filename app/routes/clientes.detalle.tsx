import { useState } from "react";
import { data, Link, NavLink, Outlet, useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/clientes.detalle";
import { desactivarCliente, getCliente, reactivarCliente } from "~/lib/api/clientes";
import { ApiError } from "~/lib/api/errors";
import { requireUser } from "~/lib/auth/guards";
import { ESTRATEGIA_LABEL, formatDateTime } from "~/lib/format";
import { Alert, Badge, Button, buttonClasses, ConfirmDialog, PageHeader } from "~/components/ui";
export const meta = () => [{ title: "Detalle del cliente · Mibers" }];
export async function clientLoader({ request, params }: Route.ClientLoaderArgs) {
  await requireUser(request);
  try {
    return { cliente: await getCliente(params.clienteId) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404)
      throw data("Cliente no encontrado.", { status: 404 });
    throw error;
  }
}
export async function clientAction({ request, params }: Route.ClientActionArgs) {
  await requireUser(request);
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent !== "desactivar" && intent !== "reactivar")
    return { ok: false, error: "Acción inválida." };
  try {
    await (intent === "desactivar" ? desactivarCliente : reactivarCliente)(params.clienteId);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    throw error;
  }
}
export function ClienteTabs({ id }: { id: string }) {
  return (
    <nav
      aria-label="Secciones del cliente"
      className="border-line flex max-w-full gap-1 overflow-x-auto border-b"
    >
      {[
        ["", "Ficha"],
        ["/contactos", "Contactos WhatsApp"],
        ["/redes", "Redes sociales"],
      ].map(([suffix, label]) => (
        <NavLink
          key={suffix}
          to={`/clientes/${id}${suffix}`}
          end={suffix === ""}
          className={({ isActive }) =>
            `focus-visible:outline-brand-500 shrink-0 border-b-2 px-4 py-3 text-sm font-medium focus-visible:outline-2 ${isActive ? "border-brand-600 text-brand-700" : "text-ink-muted hover:text-ink border-transparent"}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
export default function ClienteDetalle() {
  const { cliente } = useLoaderData<typeof clientLoader>();
  const fetcher = useFetcher<typeof clientAction>();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={cliente.nombre}
        breadcrumb={<Link to="/clientes">Clientes</Link>}
        actions={
          <>
            <Link
              to={`/clientes/${cliente.id}/editar`}
              className={buttonClasses({ variant: "secondary" })}
            >
              Editar
            </Link>
            <Button
              variant={cliente.activo ? "danger" : "primary"}
              onClick={() => setConfirm(true)}
            >
              {cliente.activo ? "Desactivar" : "Reactivar"}
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Badge tone={cliente.activo ? "success" : "neutral"}>
          {cliente.activo ? "Activo" : "Inactivo"}
        </Badge>
        <Badge tone="brand">{ESTRATEGIA_LABEL[cliente.estrategia]}</Badge>
      </div>
      {!cliente.activo && (
        <Alert tone="warning">
          Cliente inactivo
          {cliente.desactivado_at ? ` desde el ${formatDateTime(cliente.desactivado_at)}` : ""}.
        </Alert>
      )}
      {fetcher.data?.error && <Alert tone="danger">{fetcher.data.error}</Alert>}
      <ClienteTabs id={cliente.id} />
      <Outlet />
      <ConfirmDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          fetcher.submit(
            { intent: cliente.activo ? "desactivar" : "reactivar" },
            { method: "post" },
          );
          setConfirm(false);
        }}
        title={cliente.activo ? "Desactivar cliente" : "Reactivar cliente"}
        confirmLabel={cliente.activo ? "Desactivar" : "Reactivar"}
        tone={cliente.activo ? "danger" : "primary"}
        description={
          cliente.activo
            ? "Su información e historial se conservan durante 1 año. Dejará de aparecer en Empresas actuales."
            : "El cliente volverá a aparecer en Empresas actuales."
        }
      />
    </div>
  );
}
