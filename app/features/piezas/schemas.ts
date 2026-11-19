import { z } from "zod";
export const NETWORKS = ["INSTAGRAM", "FACEBOOK"] as const;
export const TYPES = ["POST", "CARRUSEL", "REEL", "HISTORIA", "PORTADA"] as const;
export function colombiaToIso(value: string): string {
  return new Date(`${value}${value.length === 16 ? ":00" : ""}-05:00`).toISOString();
}
export function isoToColombia(value: string | null): string {
  return value ? new Date(new Date(value).getTime() - 5 * 3600_000).toISOString().slice(0, 16) : "";
}
const lines = (value: string) =>
  value
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
export const piezaSchema = z
  .object({
    cliente: z.string().min(1, "Selecciona un cliente."),
    titulo: z.string().trim().max(200),
    tipo: z.enum(TYPES),
    programada_para: z
      .string()
      .min(1, "Indica la fecha y hora.")
      .refine(
        (s) =>
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) &&
          !Number.isNaN(Date.parse(`${s}-05:00`)) &&
          isoToColombia(colombiaToIso(s)) === s,
        "Fecha inválida.",
      ),
    redes: z
      .string()
      .transform((s) => s.split(",").filter(Boolean))
      .pipe(z.array(z.enum(NETWORKS)).min(1, "Selecciona al menos una red.")),
    copy_comun: z.string().trim(),
    distinto: z.string().optional(),
    INSTAGRAM: z.string().optional(),
    FACEBOOK: z.string().optional(),
    hashtags: z.string().transform((s) => s.split(/[\s,]+/).filter(Boolean)),
    enlaces: z
      .string()
      .transform(lines)
      .pipe(z.array(z.url("Escribe un enlace válido por línea."))),
    campana: z.string().max(150),
    responsable: z.string().optional(),
    mensaje_cliente: z.string(),
  })
  .superRefine((value, ctx) => {
    for (const red of value.redes) {
      if (!(value.distinto === "true" ? value[red]?.trim() : value.copy_comun))
        ctx.addIssue({
          code: "custom",
          path: [value.distinto === "true" ? red : "copy_comun"],
          message: "El copy es obligatorio para cada red.",
        });
    }
  })
  .transform((v) => ({
    cliente: v.cliente,
    titulo: v.titulo,
    tipo: v.tipo,
    programada_para: colombiaToIso(v.programada_para),
    redes: v.redes.map((red) => ({ red, copy: v.distinto === "true" ? v[red]?.trim() || "" : "" })),
    copy_comun: v.copy_comun,
    hashtags: v.hashtags,
    enlaces: v.enlaces,
    campana: v.campana,
    ...(v.responsable !== undefined ? { responsable: v.responsable || null } : {}),
    mensaje_cliente: v.mensaje_cliente,
  }));
