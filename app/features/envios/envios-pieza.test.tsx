import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { EstadoPieza } from "~/lib/api/types";
import { EnviosPieza, type EnviosPiezaData } from "./envios-pieza";
import { envioDePrueba } from "./fixtures";

function renderSeccion(estado: EstadoPieza, envios: EnviosPiezaData) {
  return render(
    <MemoryRouter>
      <EnviosPieza estado={estado} envios={envios} />
    </MemoryRouter>,
  );
}
const seccion = () => screen.queryByRole("region", { name: "Envíos al cliente" });

describe("sección Envíos al cliente de la pieza", () => {
  it.each<EstadoPieza>(["PUBLICADA", "COMPARTIDA"])(
    "se muestra vacía cuando la pieza está %s",
    (estado) => {
      renderSeccion(estado, { items: [], error: null });
      expect(seccion()).toHaveTextContent("Esta pieza aún no se ha enviado al cliente.");
    },
  );
  it("se oculta si la pieza no está publicada ni tiene envíos", () => {
    renderSeccion("APROBADA", { items: [], error: null });
    expect(seccion()).toBeNull();
  });
  it("se muestra si hay envíos aunque la pieza no esté publicada", () => {
    renderSeccion("EN_REVISION", { items: [envioDePrueba("ENVIADO")], error: null });
    expect(within(seccion()!).getAllByText("Laura Gómez").length).toBeGreaterThan(0);
  });
  it("muestra el error del servidor", () => {
    renderSeccion("PUBLICADA", { items: null, error: "Servicio no disponible." });
    expect(within(seccion()!).getByRole("alert")).toHaveTextContent("Servicio no disponible.");
  });
  it("lista los envíos con número enmascarado e insignias por estado", () => {
    renderSeccion("COMPARTIDA", {
      items: [
        envioDePrueba("PENDIENTE"),
        envioDePrueba("ENVIADO"),
        envioDePrueba("ENTREGADO"),
        envioDePrueba("LEIDO"),
        envioDePrueba("FALLIDO", { error: "Número sin WhatsApp." }),
      ],
      error: null,
    });
    const tabla = within(within(seccion()!).getByRole("table"));
    expect(tabla.queryByRole("columnheader", { name: "Pieza" })).toBeNull();
    expect(tabla.getAllByText("•••• 1234")).toHaveLength(5);
    const tono = (label: string) => tabla.getByText(label, { selector: "span" }).className;
    expect(tono("Pendiente")).toContain("bg-surface-muted");
    expect(tono("Enviado")).toContain("bg-info-50");
    expect(tono("Entregado")).toContain("bg-success-50");
    expect(tono("Leído")).toContain("bg-success-50");
    expect(tono("Fallido")).toContain("bg-danger-50");
    expect(tabla.getByText("Número sin WhatsApp.")).toBeInTheDocument();
  });
});
