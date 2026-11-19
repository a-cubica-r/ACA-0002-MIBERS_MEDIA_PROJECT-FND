import type { ReactNode } from "react";
import { Form, Outlet, isRouteErrorResponse, useNavigation, useRouteError } from "react-router";
import type { Route } from "./+types/app-layout";
import { AppShell } from "~/components/layout/app-shell";
import { IconBuilding, IconHome, IconLogout, IconUser, IconUsers } from "~/components/layout/icons";
import { Button } from "~/components/ui/button";
import { Alert } from "~/components/ui/alert";
import { requireUser } from "~/lib/auth/guards";
import { getCachedUser } from "~/lib/auth/session";
import { ApiError } from "~/lib/api/errors";
import type { Usuario } from "~/lib/api/types";
import { fullName, ROLE_LABEL } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Panel · Mibers" }];
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireUser(request);
  return { user };
}
function Shell({ user, children }: { user: Usuario | null; children: ReactNode }) {
  const navigation = useNavigation();
  const navItems = [
    { to: "/", label: "Inicio", icon: IconHome, end: true },
    { to: "/clientes", label: "Clientes", icon: IconBuilding },
    ...(user?.role === "ADMIN" ? [{ to: "/usuarios", label: "Usuarios", icon: IconUsers }] : []),
    { to: "/perfil", label: "Mi perfil", icon: IconUser },
  ];
  return (
    <AppShell
      navItems={navItems}
      userName={user ? fullName(user) : "Mi cuenta"}
      roleLabel={user ? ROLE_LABEL[user.role] : ""}
      logoutForm={
        <Form method="post" action="/perfil">
          <input type="hidden" name="intent" value="logout" />
          <Button variant="ghost" type="submit" className="w-full">
            <IconLogout className="size-4" />
            Cerrar sesión
          </Button>
        </Form>
      }
    >
      {navigation.state !== "idle" && (
        <div
          role="progressbar"
          aria-label="Cargando página"
          className="bg-brand-600 fixed inset-x-0 top-0 z-[70] h-1 animate-pulse"
        />
      )}
      {children}
    </AppShell>
  );
}
export default function AppLayout({ loaderData }: Route.ComponentProps) {
  return (
    <Shell user={loaderData.user}>
      <Outlet />
    </Shell>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) || error instanceof ApiError ? error.status : 500;
  const message =
    status === 403
      ? "Solo el administrador puede ver esta página."
      : status === 404
        ? "No encontramos la página o el recurso que buscas."
        : "No se pudo cargar esta página. Inténtalo de nuevo.";
  return (
    <Shell user={getCachedUser()}>
      <Alert tone="danger" title={status === 404 ? "Página no encontrada" : "No se pudo continuar"}>
        {message}
      </Alert>
    </Shell>
  );
}
