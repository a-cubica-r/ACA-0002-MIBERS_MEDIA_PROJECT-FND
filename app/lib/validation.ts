import { z } from "zod";
export const telefonoE164 = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Usa el formato internacional, por ejemplo +573001112233.");
export const password = z.string().min(10, "La contraseña debe tener al menos 10 caracteres.");
export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { success: true; data: z.output<T> } | { success: false; fieldErrors: Record<string, string> } {
  const result = schema.safeParse(Object.fromEntries(formData));
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "_form";
    fieldErrors[field] ??= issue.message;
  }
  return { success: false, fieldErrors };
}
