import { Form, Link, useNavigation } from "react-router";
import { Button, buttonClasses } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import type { Usuario } from "~/lib/api/types";
import { ActionFeedback, type FormResult } from "./action-feedback";

export function UsuarioForm({ user, result }: { user?: Usuario; result?: FormResult }) {
  const navigation = useNavigation();
  function field(
    name: "username" | "first_name" | "last_name" | "cargo" | "whatsapp_number",
    label: string,
    hint?: string,
  ) {
    const error = result?.fieldErrors?.[name];
    return (
      <Field htmlFor={name} label={label} hint={hint} error={error} required={name === "username"}>
        <Input
          id={name}
          name={name}
          defaultValue={user?.[name] ?? ""}
          readOnly={name === "username" && !!user}
          required={name === "username"}
          type={name === "whatsapp_number" ? "tel" : "text"}
          autoComplete={name === "username" ? "off" : undefined}
          invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </Field>
    );
  }
  return (
    <Form method="post" className="space-y-5" noValidate>
      <input type="hidden" name="intent" value="guardar" />
      <ActionFeedback result={result} success="Los datos del usuario se guardaron correctamente." />
      {field("username", "Usuario", user ? "El nombre de usuario no se puede cambiar." : undefined)}
      <div className="grid gap-5 sm:grid-cols-2">
        {field("first_name", "Nombres")}
        {field("last_name", "Apellidos")}
      </div>
      <Field htmlFor="role" label="Rol" required error={result?.fieldErrors?.role}>
        <Select
          id="role"
          name="role"
          defaultValue={user?.role ?? "STAFF"}
          invalid={!!result?.fieldErrors?.role}
          aria-describedby={result?.fieldErrors?.role ? "role-error" : undefined}
        >
          <option value="STAFF">Personal</option>
          <option value="ADMIN">Administrador</option>
        </Select>
      </Field>
      {field("cargo", "Cargo", "Informativo: no cambia los permisos")}
      {field(
        "whatsapp_number",
        "WhatsApp (opcional)",
        "Para recibir alertas. Usa formato internacional, por ejemplo +573001112233.",
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={navigation.state === "submitting"}>
          {user ? "Guardar cambios" : "Crear usuario"}
        </Button>
        <Link to="/usuarios" className={buttonClasses({ variant: "secondary" })}>
          Cancelar
        </Link>
      </div>
    </Form>
  );
}
