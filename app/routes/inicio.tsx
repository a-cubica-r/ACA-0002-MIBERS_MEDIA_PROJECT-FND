import clsx from "clsx";
import { Link } from "react-router";

import { Card, EmptyState, PageHeader, buttonClasses } from "~/components/ui";
import { EmpresaCard } from "~/features/inicio/empresa-card";
import { listEmpresasActuales } from "~/lib/api/empresas";
import { requireUser } from "~/lib/auth/guards";
import { useCurrentUser } from "~/lib/auth/use-current-user";
import { fullName } from "~/lib/format";
import type { Route } from "./+types/inicio";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireUser(request);
  return { empresas: await listEmpresasActuales() };
}

export function meta() {
  return [{ title: "Inicio · Mibers" }];
}

export default function Inicio({ loaderData }: Route.ComponentProps) {
  const user = useCurrentUser();
  const { empresas } = loaderData;
  const piezasPendientes = empresas.reduce(
    (total, empresa) =>
      total +
      empresa.pendientes.borradores +
      empresa.pendientes.en_revision +
      empresa.pendientes.cambios_solicitados +
      empresa.pendientes.aprobadas_sin_programar +
      empresa.pendientes.fallidas,
    0,
  );
  const publicacionesFallidas = empresas.reduce(
    (total, empresa) => total + empresa.pendientes.fallidas,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${fullName(user)}`}
        description="Empresas actuales: próximas publicaciones y pendientes de cada cliente."
        actions={
          <Link to="/clientes/nuevo" className={buttonClasses()}>
            Nuevo cliente
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-ink-muted text-sm">Clientes activos</p>
          <p className="text-ink mt-1 text-2xl font-semibold">{empresas.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-ink-muted text-sm">Piezas pendientes</p>
          <p className="text-ink mt-1 text-2xl font-semibold">{piezasPendientes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-ink-muted text-sm">Publicaciones fallidas</p>
          <p
            className={clsx(
              "mt-1 text-2xl font-semibold",
              publicacionesFallidas > 0 ? "text-danger-700" : "text-ink",
            )}
          >
            {publicacionesFallidas}
          </p>
        </Card>
      </div>

      {empresas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {empresas.map((empresa) => (
            <EmpresaCard key={empresa.cliente.id} empresa={empresa} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aún no hay clientes activos"
          description="Registra tu primer cliente para empezar a planear su contenido."
          action={
            <Link to="/clientes/nuevo" className={buttonClasses()}>
              Nuevo cliente
            </Link>
          }
        />
      )}
    </div>
  );
}
