import { Alert } from "~/components/ui/alert";
import { CopyButton } from "~/components/ui/copy-button";

export function TemporaryPasswordPanel({ password }: { password: string }) {
  return (
    <div className="space-y-4">
      <Alert tone="warning">
        Se muestra una sola vez; entrégasela a la persona. Deberá cambiarla al ingresar.
      </Alert>
      <div className="bg-surface-muted flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
        <code className="text-ink text-lg font-semibold break-all">{password}</code>
        <CopyButton value={password} label="Copiar contraseña" />
      </div>
    </div>
  );
}
