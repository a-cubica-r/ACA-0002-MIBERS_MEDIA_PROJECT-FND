import { Link } from "react-router";

import { buttonClasses } from "~/components/ui";

export function meta() {
  return [{ title: "Página no encontrada · Mibers" }];
}

export default function NoEncontrado() {
  return (
    <main className="bg-canvas grid min-h-dvh place-items-center px-4 py-10">
      <div className="max-w-md text-center">
        <p className="text-brand-600 text-6xl font-semibold tracking-tight sm:text-8xl">404</p>
        <h1 className="text-ink mt-4 text-2xl font-semibold">Página no encontrada</h1>
        <p className="text-ink-muted mt-2">La dirección que buscas no existe o fue movida.</p>
        <Link to="/" className={buttonClasses({ className: "mt-8" })}>
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
