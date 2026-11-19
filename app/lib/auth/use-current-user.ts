import { useRouteLoaderData } from "react-router";

import type { Usuario } from "../api/types";

/** Id del layout autenticado en app/routes.ts. Su clientLoader DEBE devolver `{ user }`. */
export const APP_LAYOUT_ROUTE_ID = "routes/app-layout";

/** Usuario autenticado, disponible en cualquier ruta hija de app-layout. */
export function useCurrentUser(): Usuario {
  const data = useRouteLoaderData(APP_LAYOUT_ROUTE_ID) as { user: Usuario } | undefined;
  if (!data) throw new Error("useCurrentUser solo puede usarse dentro de app-layout.");
  return data.user;
}

export function useIsAdmin(): boolean {
  return useCurrentUser().role === "ADMIN";
}
