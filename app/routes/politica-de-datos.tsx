import { Link } from "react-router";
import type { Route } from "./+types/politica-de-datos";
import { Card, CardBody } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { getPoliticaVigente } from "~/lib/api/legal";
import { formatDate } from "~/lib/format";

export const meta: Route.MetaFunction = () => [
  { title: "Política de tratamiento de datos · Mibers" },
];

export async function clientLoader() {
  return { politica: await getPoliticaVigente() };
}

export default function PoliticaDeDatos({ loaderData }: Route.ComponentProps) {
  const { politica } = loaderData;

  return (
    <main className="bg-canvas min-h-dvh px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-brand-700 text-sm font-semibold">Mibers Creativos</p>
          <h1 className="text-ink text-2xl font-semibold sm:text-3xl">
            {politica ? politica.titulo : "Política de tratamiento de datos"}
          </h1>
          {politica && (
            <p className="text-ink-muted text-sm">
              Versión {politica.version} · Vigente desde {formatDate(politica.vigente_desde)}
            </p>
          )}
        </header>

        {politica ? (
          <Card>
            <CardBody>
              <div className="text-ink text-sm leading-relaxed whitespace-pre-line">
                {politica.contenido}
              </div>
            </CardBody>
          </Card>
        ) : (
          <EmptyState
            title="La política aún no se ha publicado"
            description="Cuando el administrador publique una versión, aparecerá en esta página."
          />
        )}

        <p className="text-sm">
          <Link to="/login" className="text-brand-700 font-medium hover:underline">
            Ir a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
