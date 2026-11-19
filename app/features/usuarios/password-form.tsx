import { useEffect, useRef } from "react";
import { Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { ActionFeedback, type FormResult } from "./action-feedback";

export function PasswordForm({
  result,
  temporary = false,
}: {
  result?: FormResult;
  temporary?: boolean;
}) {
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (result?.ok) formRef.current?.reset();
  }, [result]);
  const fields = [
    [
      "current_password",
      temporary ? "Contraseña actual (temporal)" : "Contraseña actual",
      "current-password",
    ],
    ["new_password", "Nueva contraseña", "new-password"],
    ["confirm_password", "Confirmar nueva contraseña", "new-password"],
  ];
  return (
    <Form ref={formRef} method="post" className="space-y-5" noValidate>
      <input type="hidden" name="intent" value="cambiar-password" />
      <ActionFeedback result={result} success="Tu contraseña se actualizó correctamente." />
      <p className="text-ink-muted text-sm">
        Usa al menos 10 caracteres. Elige una contraseña distinta de la actual, que no sea común ni
        se parezca a tu usuario.
      </p>
      {fields.map(([name, label, autocomplete]) => (
        <Field key={name} htmlFor={name} label={label} required error={result?.fieldErrors?.[name]}>
          <Input
            id={name}
            name={name}
            type="password"
            autoComplete={autocomplete}
            required
            invalid={!!result?.fieldErrors?.[name]}
            aria-describedby={result?.fieldErrors?.[name] ? `${name}-error` : undefined}
          />
        </Field>
      ))}
      <Button type="submit" loading={navigation.state === "submitting"}>
        Cambiar contraseña
      </Button>
    </Form>
  );
}
