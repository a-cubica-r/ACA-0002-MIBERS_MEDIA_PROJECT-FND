import type { Envio, EstadoEnvio } from "~/lib/api/types";

export function envioDePrueba(estado: EstadoEnvio, overrides: Partial<Envio> = {}): Envio {
  return {
    id: `e-${estado}`,
    pieza: { id: "p1", titulo: "Lanzamiento de temporada", tipo: "POST" },
    cliente: { id: "c1", nombre: "Café La Montaña" },
    contacto: { id: "k1", nombre: "Laura Gómez" },
    numero: "•••• 1234",
    archivo: { id: "a1", nombre: "portada.jpg", kind: "image" },
    estado,
    error: "",
    enviado_at: estado === "PENDIENTE" ? null : "2026-11-20T15:00:00Z",
    entregado_at: ["ENTREGADO", "LEIDO"].includes(estado) ? "2026-11-20T15:05:00Z" : null,
    created_at: "2026-11-20T14:59:00Z",
    ...overrides,
  };
}
