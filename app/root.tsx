import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap",
  },
];

export function meta() {
  return [{ title: "Mibers" }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return <div className="text-ink-muted grid min-h-dvh place-items-center text-sm">Cargando…</div>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Algo salió mal";
  let details = "Ocurrió un error inesperado. Intenta recargar la página.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Página no encontrada" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "La página que buscas no existe o fue movida."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-2xl p-6 pt-16">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-ink-muted mt-2">{details}</p>
      <a href="/" className="text-brand-700 mt-6 inline-block text-sm font-medium underline">
        Volver al inicio
      </a>
      {stack && (
        <pre className="bg-surface-muted mt-6 overflow-x-auto rounded-lg p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
