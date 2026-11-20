import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, Outlet } from "react-router";
import { describe, expect, it } from "vitest";
import { ClienteTabs } from "./clientes.detalle";
import { contractRemaining } from "./clientes.detalle.ficha";
describe("secciones del cliente", () => {
  it("navega entre pestañas y marca la sección activa", async () => {
    const Stub = createRoutesStub([
      {
        path: "/clientes/:clienteId",
        Component: () => (
          <>
            <ClienteTabs id="1" />
            <Outlet />
          </>
        ),
        children: [
          { index: true, Component: () => <p>Ficha de prueba</p> },
          { path: "contactos", Component: () => <p>Lista de contactos</p> },
          { path: "redes", Component: () => <p>Cuentas registradas</p> },
        ],
      },
    ]);
    render(<Stub initialEntries={["/clientes/1"]} />);
    expect(screen.getByRole("navigation", { name: "Secciones del cliente" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ficha" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("link", { name: "Contactos WhatsApp" }));
    expect(await screen.findByText("Lista de contactos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contactos WhatsApp" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Ficha" })).not.toHaveAttribute("aria-current");
  });
  it("calcula vencimiento con el día de Colombia", () => {
    const now = new Date("2026-11-21T02:00:00Z");
    expect(contractRemaining("2026-11-20", now)).toBe("Vence hoy");
    expect(contractRemaining("2026-11-19", now)).toBe("Vencido");
    expect(contractRemaining("2026-11-22", now)).toBe("2 días restantes");
    expect(contractRemaining(null, now)).toBe("Sin fecha fin");
  });
});
