import { listPiezas } from "~/lib/api/piezas";
import type { PiezaResumen } from "~/lib/api/types";
export interface AnalisisPublicacion {
  id: string;
  titulo: string;
  ejemplo: boolean;
  sentimiento: { positivo: number; neutral: number; negativo: number };
  temas: string[];
  comentarios: string[];
  resumen: string;
}
export function analizarPublicacion(
  pieza: Pick<PiezaResumen, "id" | "titulo">,
  ejemplo = false,
): AnalisisPublicacion {
  const seed = Array.from(pieza.id).reduce(
    (value, char) => (Math.imul(value, 31) + char.charCodeAt(0)) >>> 0,
    7,
  );
  const positivo = 45 + (seed % 36);
  const negativo = (seed >>> 8) % 16;
  const temas = [
    "Calidad del producto",
    "Atención al cliente",
    "Precios y promociones",
    "Disponibilidad",
    "Experiencia de marca",
  ];
  const principal = seed % temas.length;
  return {
    id: pieza.id,
    titulo: pieza.titulo,
    ejemplo,
    sentimiento: { positivo, neutral: 100 - positivo - negativo, negativo },
    temas: [temas[principal], temas[(principal + 1) % temas.length]],
    comentarios: [
      "Me encanta esta propuesta, se nota el cuidado en los detalles.",
      "¿Dónde puedo consultar más información y disponibilidad?",
      "Me gustaría conocer mejor los precios antes de decidir.",
    ],
    resumen: `En esta simulación predomina una recepción positiva (${positivo} %). Las conversaciones de ejemplo se concentran en ${temas[principal].toLowerCase()} y ${temas[(principal + 1) % temas.length].toLowerCase()}. Las preguntas muestran interés por conocer más detalles antes de tomar una decisión.`,
  };
}
export async function getAnalisis(clienteId: string): Promise<AnalisisPublicacion[]> {
  const piezas: PiezaResumen[] = [];
  let page = 1;
  while (true) {
    const response = await listPiezas({
      cliente: clienteId,
      estado: "PUBLICADA",
      page,
      page_size: 100,
    });
    piezas.push(...response.results);
    if (!response.next) break;
    page += 1;
  }
  if (piezas.length) return piezas.map((pieza) => analizarPublicacion(pieza));
  return [
    "Una mirada a nuestra marca",
    "Conoce nuestros productos",
    "Historias de nuestra comunidad",
  ].map((titulo, index) =>
    analizarPublicacion({ id: `${clienteId}-ejemplo-${index}`, titulo }, true),
  );
}
