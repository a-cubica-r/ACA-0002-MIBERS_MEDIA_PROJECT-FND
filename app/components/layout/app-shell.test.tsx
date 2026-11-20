import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { AppShell, type NavItem } from "./app-shell";
import { IconBuilding, IconHome, IconUsers } from "./icons";

const navItems: NavItem[] = [
  { to: "/", label: "Inicio", icon: IconHome, end: true },
  { to: "/clientes", label: "Clientes", icon: IconBuilding },
  { to: "/usuarios", label: "Usuarios", icon: IconUsers },
];

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/clientes"]}>
      <AppShell
        navItems={navItems}
        userName="Ana Pérez"
        roleLabel="Administrador"
        logoutForm={<button type="submit">Cerrar sesión</button>}
      >
        <p>Contenido de la página</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("renderiza los enlaces de navegación y el contenido", () => {
    renderShell();

    for (const item of navItems) {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
    }
    expect(screen.getByRole("main")).toHaveTextContent("Contenido de la página");
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });

  it("marca con aria-current la ruta actual", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  it("abre el panel de navegación con el botón Abrir menú", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));

    expect(screen.getByRole("button", { name: "Cerrar menú" })).toBeInTheDocument();
  });

  it("cierra el panel con la tecla Escape", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("button", { name: "Cerrar menú" })).not.toBeInTheDocument();
  });
});
