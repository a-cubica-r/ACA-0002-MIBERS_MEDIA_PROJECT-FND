import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Modal } from "~/components/ui/modal";
import type { Usuario } from "~/lib/api/types";
import { activarUsuario, desactivarUsuario, restablecerPassword } from "~/lib/api/usuarios";
import { ActionFeedback, apiFailure, type FormResult } from "./action-feedback";
import { TemporaryPasswordPanel } from "./temporary-password-panel";

export interface UsuarioActionResult extends FormResult {
  temporary_password?: string;
}
export async function mutateUsuario(
  intent: FormDataEntryValue | null,
  id: string,
): Promise<UsuarioActionResult> {
  try {
    if (intent === "restablecer") return { ok: true, ...(await restablecerPassword(id)) };
    if (intent === "desactivar") await desactivarUsuario(id);
    else if (intent === "activar") await activarUsuario(id);
    else return { ok: false, error: "La acción solicitada no es válida." };
    return { ok: true };
  } catch (error) {
    return apiFailure(error);
  }
}
export function UsuarioActions({ user, currentUserId }: { user: Usuario; currentUserId: string }) {
  const fetcher = useFetcher<UsuarioActionResult>();
  const [intent, setIntent] = useState<"activar" | "desactivar" | "restablecer" | null>(null);
  const [dismissed, setDismissed] = useState<UsuarioActionResult>();
  const busy = fetcher.state !== "idle";
  const reset = intent === "restablecer";
  const label = reset
    ? "Restablecer contraseña"
    : intent === "desactivar"
      ? "Desactivar usuario"
      : "Activar usuario";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(user.id !== currentUserId || !user.is_active) && (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setIntent(user.is_active ? "desactivar" : "activar")}
          >
            {user.is_active ? "Desactivar" : "Activar"}
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setIntent("restablecer")}>
          Restablecer contraseña
        </Button>
      </div>
      <ActionFeedback
        result={busy ? undefined : fetcher.data}
        success={fetcher.data?.temporary_password ? undefined : "Estado actualizado."}
      />
      <ConfirmDialog
        open={intent !== null}
        onCancel={() => setIntent(null)}
        title={label}
        confirmLabel={label}
        tone={intent === "desactivar" ? "danger" : "primary"}
        loading={busy}
        description={
          reset
            ? `Se generará una contraseña temporal para ${user.username}. La persona deberá cambiarla al ingresar.`
            : intent === "desactivar"
              ? `Se impedirá el acceso de ${user.username}. Desactivar no borra lo que hizo ni su historial.`
              : `Se permitirá de nuevo el acceso de ${user.username}.`
        }
        onConfirm={() => {
          fetcher.submit({ intent: intent!, usuarioId: user.id }, { method: "post" });
          setIntent(null);
        }}
      />
      <Modal
        open={!busy && !!fetcher.data?.temporary_password && fetcher.data !== dismissed}
        onClose={() => setDismissed(fetcher.data)}
        title={`Contraseña temporal de ${user.username}`}
      >
        {fetcher.data?.temporary_password && (
          <TemporaryPasswordPanel password={fetcher.data.temporary_password} />
        )}
      </Modal>
    </div>
  );
}
