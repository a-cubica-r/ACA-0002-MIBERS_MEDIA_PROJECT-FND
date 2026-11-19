import { z } from "zod";
import { password, telefonoE164 } from "~/lib/validation";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Escribe tu usuario."),
  password: z.string().min(1, "Escribe tu contraseña."),
});
export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Escribe tu contraseña actual."),
    new_password: password,
    confirm_password: z.string().min(1, "Confirma la nueva contraseña."),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Las contraseñas no coinciden.",
  })
  .refine((value) => value.current_password !== value.new_password, {
    path: ["new_password"],
    message: "La nueva contraseña debe ser distinta de la actual.",
  });
const userFields = {
  first_name: z.string().trim().max(150, "Usa máximo 150 caracteres."),
  last_name: z.string().trim().max(150, "Usa máximo 150 caracteres."),
  role: z.enum(["ADMIN", "STAFF"], { error: "Selecciona un rol válido." }),
  cargo: z.string().trim().max(100, "Usa máximo 100 caracteres."),
  whatsapp_number: z.union([z.literal(""), telefonoE164]).transform((value) => value || null),
};
export const usuarioUpdateSchema = z.object(userFields);
export const usuarioCreateSchema = usuarioUpdateSchema.extend({
  username: z
    .string()
    .trim()
    .min(1, "Escribe un usuario.")
    .max(150, "Usa máximo 150 caracteres.")
    .regex(/^[\p{L}\p{N}_.@+-]+$/u, "Usa letras, números y los símbolos @ . + - _."),
});
