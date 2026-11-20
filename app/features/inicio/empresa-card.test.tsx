import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import type { Cliente, EmpresaActual } from "~/lib/api/types";

import { EmpresaCard } from "./empresa-card";

const cliente: Cliente = {
  id: "cli-1",
  nombre: "Aroma Café",
  contacto_nombre: "Laura Gómez",
  contacto_telefono: "+573001112233",
  contacto_email: "laura@aromacafe.co",
  posts_por_semana: 5,
  contrato_inicio: "2026-01-15",
  contrato_fin: null,
  estrategia: "POSICIONAR",
  objetivo: "Posicionar la marca en la ciudad.",
  tiene_manual_marca: false,
  manual_marca_nombre: "",
  activo: true,
  desactivado_at: null,
  contactos_whatsapp: [],
  cuentas: [],
  created_at: "2026-01-10T14:00:00Z",
};

const empresa: EmpresaActual = {
  cliente,
  proximas_publicaciones: [
    {
      id: "pieza-1",
      cliente: cliente.id,
      cliente_nombre: cliente.nombre,
      titulo: "Lanzamiento de temporada",
      tipo: "POST",
      estado: "PROGRAMADA",
      programada_para: "2026-11-21T15:00:00Z",
      redes: ["INSTAGRAM"],
      archivos_count: 2,
      responsable: null,
      responsable_username: "ana",
    },
  ],
  pendientes: {
    borradores: 3,
    en_revision: 2,
    cambios_solicitados: 0,
    aprobadas_sin_programar: 0,
    fallidas: 1,
  },
  semana_actual: { plan: 5, programadas: 2 },
};

function renderCard(value: EmpresaActual) {
  return render(
    <MemoryRouter>
      <EmpresaCard empresa={value} />
    </MemoryRouter>,
  );
}

describe("EmpresaCard", () => {
  it("muestra el cliente, el avance de la semana y el chip de fallidas", () => {
    renderCard(empresa);

    expect(screen.getByText("Aroma Café")).toBeInTheDocument();
    expect(screen.getByText("2 de 5 publicaciones programadas")).toBeInTheDocument();
    expect(screen.getByText("Fallidas: 1")).toBeInTheDocument();

    const barra = screen.getByRole("progressbar", { name: "Avance de la semana" });
    expect(barra).toHaveAttribute("aria-valuenow", "2");
    expect(barra).toHaveAttribute("aria-valuemax", "5");
  });

  it("muestra 'Sin pendientes' cuando todos los contadores están en cero", () => {
    renderCard({
      ...empresa,
      pendientes: {
        borradores: 0,
        en_revision: 0,
        cambios_solicitados: 0,
        aprobadas_sin_programar: 0,
        fallidas: 0,
      },
    });

    expect(screen.getByText("Sin pendientes")).toBeInTheDocument();
    expect(screen.queryByText("Fallidas: 0")).not.toBeInTheDocument();
  });
});
