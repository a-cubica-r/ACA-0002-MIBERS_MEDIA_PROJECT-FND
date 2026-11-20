import { NavLink } from "react-router";
import { buttonClasses } from "~/components/ui";
export function MetricasTabs({ cliente }: { cliente: string }) {
  const query = cliente ? `?${new URLSearchParams({ cliente })}` : "";
  return (
    <nav aria-label="Métricas y analítica" className="flex flex-wrap gap-2">
      {[
        ["/metricas", "Tablero de indicadores"],
        ["/metricas/cargar", "Cargar métricas"],
        ["/metricas/analisis", "Análisis asistido por IA"],
      ].map(([path, label]) => (
        <NavLink
          key={path}
          end
          to={`${path}${query}`}
          className={({ isActive }) =>
            buttonClasses({ variant: isActive ? "primary" : "secondary", size: "sm" })
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
