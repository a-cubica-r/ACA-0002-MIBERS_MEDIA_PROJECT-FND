import { render, screen, within } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import type { Role, Usuario } from "~/lib/api/types";
import AppLayout from "./app-layout";

const usuario = (role: Role): Usuario => ({
  id: "u1",
  username: "ana",
  first_name: "Ana",
  last_name: "Pérez",
  role,
  cargo: "",
  whatsapp_number: null,
  is_active: true,
  must_change_password: false,
  last_login: null,
  date_joined: "2026-01-01T00:00:00Z",
});

async function renderMenu(role: Role) {
  const Stub = createRoutesStub([
    {
      path: "/",
      Component: AppLayout as never,
      loader: () => ({ user: usuario(role) }),
      children: [{ index: true, Component: () => <p>Página de prueba</p> }],
    },
  ]);
  render(<Stub initialEntries={["/"]} />);
  await screen.findByText("Página de prueba");
  return screen.getAllByRole("navigation")[0];
}

describe("menú principal", () => {
  it.each<Role>(["ADMIN", "STAFF"])("no muestra las funciones retiradas (%s)", async (role) => {
    const nav = await renderMenu(role);
    for (const label of ["Tareas", "Equipo"])
      expect(within(nav).queryByRole("link", { name: label })).not.toBeInTheDocument();
    for (const href of ["/tareas", "/equipo", "/metricas/analisis"])
      expect(document.querySelector(`a[href="${href}"]`)).toBeNull();
    expect(document.querySelector('a[href^="/portal"]')).toBeNull();
    expect(within(nav).getByRole("link", { name: "Métricas" })).toHaveAttribute(
      "href",
      "/metricas",
    );
  });
});
