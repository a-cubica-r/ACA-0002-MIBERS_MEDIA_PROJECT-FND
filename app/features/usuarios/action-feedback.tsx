import { useEffect, useRef } from "react";
import { Alert } from "~/components/ui/alert";
import { ApiError } from "~/lib/api/errors";

export interface FormResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}
export function apiFailure(error: unknown): FormResult {
  if (!(error instanceof ApiError)) throw error;
  const messages: Record<string, string> = {
    invalid_credentials: "Usuario o contraseña incorrectos.",
    account_locked:
      "La cuenta está bloqueada durante 15 minutos por varios intentos fallidos. Inténtalo después de ese tiempo.",
    wrong_current_password: "La contraseña actual es incorrecta.",
    same_password: "La nueva contraseña debe ser distinta de la actual.",
    cannot_deactivate_self: "No puedes desactivar tu propio usuario.",
    last_admin: "Debe quedar al menos un administrador activo.",
  };
  return {
    ok: false,
    error: messages[error.code] ?? error.message,
    fieldErrors: error.fieldErrors,
  };
}
export function ActionFeedback({ result, success }: { result?: FormResult; success?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (result && !result.ok) ref.current?.focus();
  }, [result]);
  if (!result) return null;
  if (result.ok) return success ? <Alert tone="success">{success}</Alert> : null;
  return (
    <div ref={ref} tabIndex={-1}>
      <Alert tone="danger">{result.error ?? "Revisa los campos marcados."}</Alert>
    </div>
  );
}
