import { matchRoutes, type RouteObject } from "react-router";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { describe, expect, it } from "vitest";
import routes from "./routes";

function toRouteObjects(entries: RouteConfigEntry[]): RouteObject[] {
  return entries.map((entry) =>
    entry.index
      ? { id: entry.file, index: true, path: entry.path }
      : {
          id: entry.file,
          path: entry.path,
          children: entry.children ? toRouteObjects(entry.children) : undefined,
        },
  );
}
function resolve(pathname: string): string | undefined {
  return matchRoutes(toRouteObjects(routes), pathname)?.at(-1)?.route.id;
}

describe("mapa de rutas", () => {
  it.each(["/tareas", "/equipo", "/portal/x", "/metricas/analisis"])(
    "%s, retirada por el Acta 3, lleva a la página no encontrado",
    (pathname) => {
      expect(resolve(pathname)).toBe("routes/no-encontrado.tsx");
    },
  );
  it("mantiene las rutas de métricas", () => {
    expect(resolve("/metricas")).toBe("routes/metricas.tsx");
    expect(resolve("/metricas/cargar")).toBe("routes/metricas.cargar.tsx");
  });
});
