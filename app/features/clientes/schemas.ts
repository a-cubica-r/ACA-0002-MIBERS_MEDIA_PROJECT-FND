import { z } from "zod";
import { telefonoE164 } from "~/lib/validation";
export const MAX_MANUAL_SIZE = 25 * 1024 * 1024;
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida.")
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
    "Selecciona una fecha válida.",
  );
export const clienteSchema = z
  .object({
    nombre: z.string().trim().min(1, "Escribe el nombre de la empresa."),
    contacto_nombre: z.string().trim().default(""),
    contacto_telefono: z.union([telefonoE164, z.literal("")]).default(""),
    contacto_email: z.union([z.email("Escribe un correo válido."), z.literal("")]).default(""),
    posts_por_semana: z.coerce
      .number()
      .int("Usa un número entero.")
      .min(1, "El plan debe incluir al menos 1 post.")
      .max(14, "El máximo es 14 posts por semana."),
    contrato_inicio: date,
    contrato_fin: z.preprocess((value) => (value === "" ? null : value), date.nullish()),
    estrategia: z.enum(["VIRALIZAR", "POSICIONAR", "VENDER"], {
      error: "Selecciona una estrategia.",
    }),
    objetivo: z.string().trim().default(""),
    manual_marca: z.preprocess(
      (value) => (value instanceof File && value.size === 0 ? undefined : value),
      z
        .instanceof(File)
        .refine((file) => file.size <= MAX_MANUAL_SIZE, "El archivo no puede superar 25 MB.")
        .refine(
          (file) => /\.(pdf|png|jpe?g|docx?|pptx?|zip)$/i.test(file.name),
          "Selecciona un archivo permitido.",
        )
        .optional(),
    ),
  })
  .refine((value) => !value.contrato_fin || value.contrato_fin >= value.contrato_inicio, {
    path: ["contrato_fin"],
    message: "La fecha final no puede ser anterior al inicio.",
  });
export const contactoSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre."),
  numero: telefonoE164,
  autorizado: z.preprocess(
    (value) => value === "on" || value === "true" || value === true,
    z.boolean(),
  ),
  evidencia: z.string().trim().default(""),
});
export const cuentaSchema = z.object({
  red: z.enum(["INSTAGRAM", "FACEBOOK"]),
  handle: z.string().trim().min(1, "Escribe el usuario de la cuenta."),
  url_perfil: z
    .url("Escribe una URL válida.")
    .refine((value) => /^https?:\/\//i.test(value), "Usa una URL http o https."),
  id_externo: z.string().trim().default(""),
  estado: z.enum(["VINCULADA", "EXPIRADA", "DESVINCULADA"]).default("VINCULADA"),
});
export interface FormResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}
