import { Form, Link, useNavigation } from "react-router";
import type { Cliente } from "~/lib/api/types";
import { ESTRATEGIA_LABEL } from "~/lib/format";
import {
  Alert,
  Button,
  buttonClasses,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Textarea,
} from "~/components/ui";
import { MAX_MANUAL_SIZE, type FormResult } from "./schemas";

const strategies = {
  VIRALIZAR: "Alcance y difusión",
  POSICIONAR: "Reconocimiento de marca",
  VENDER: "Conversión",
} as const;
export function ClienteForm({ cliente, result }: { cliente?: Cliente; result?: FormResult }) {
  const busy = useNavigation().state !== "idle";
  const errors = result?.fieldErrors ?? {};
  function input(
    name:
      | "nombre"
      | "contacto_nombre"
      | "contacto_telefono"
      | "contacto_email"
      | "posts_por_semana"
      | "contrato_inicio"
      | "contrato_fin",
    label: string,
    type = "text",
    required = false,
  ) {
    return (
      <Field key={name} htmlFor={name} label={label} required={required} error={errors[name]}>
        <Input
          id={name}
          name={name}
          type={type}
          required={required}
          defaultValue={cliente?.[name] ?? (name === "posts_por_semana" ? 5 : "")}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          min={name === "posts_por_semana" ? 1 : undefined}
          max={name === "posts_por_semana" ? 14 : undefined}
        />
      </Field>
    );
  }
  return (
    <Form method="post" encType="multipart/form-data" className="space-y-6">
      {result?.error && <Alert tone="danger">{result.error}</Alert>}
      <Card>
        <CardHeader title="Datos de la empresa" />
        <CardBody>{input("nombre", "Nombre de la empresa", "text", true)}</CardBody>
      </Card>
      <Card>
        <CardHeader title="Contacto principal" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {input("contacto_nombre", "Nombre")}
          {input("contacto_telefono", "Teléfono", "tel")}
          {input("contacto_email", "Correo electrónico", "email")}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Contrato y plan" />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          {input("posts_por_semana", "Posts por semana", "number", true)}
          {input("contrato_inicio", "Inicio del contrato", "date", true)}
          {input("contrato_fin", "Fin del contrato", "date")}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Estrategia" />
        <CardBody className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Estrategia del cliente *</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(strategies).map(([value, description]) => (
                <label
                  key={value}
                  className="border-line has-checked:border-brand-600 has-checked:bg-brand-50 flex cursor-pointer items-start gap-3 rounded-lg border p-4"
                >
                  <input
                    type="radio"
                    name="estrategia"
                    value={value}
                    required
                    defaultChecked={cliente?.estrategia === value}
                    className="accent-brand-600 mt-1"
                  />
                  <span>
                    <span className="block font-medium">
                      {ESTRATEGIA_LABEL[value as keyof typeof strategies]}
                    </span>
                    <span className="text-ink-muted text-sm">{description}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.estrategia && (
              <p role="alert" className="text-danger-700 text-sm">
                {errors.estrategia}
              </p>
            )}
          </fieldset>
          <Field htmlFor="objetivo" label="Objetivo" error={errors.objetivo}>
            <Textarea id="objetivo" name="objetivo" rows={4} defaultValue={cliente?.objetivo} />
          </Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Manual de marca" />
        <CardBody className="space-y-3">
          {cliente?.tiene_manual_marca && (
            <p className="text-ink-muted text-sm break-all">
              Archivo actual: {cliente.manual_marca_nombre}. Subir otro archivo lo reemplaza.
            </p>
          )}
          <Field
            htmlFor="manual_marca"
            label="Archivo"
            error={errors.manual_marca}
            hint="PDF, PNG, JPG, DOC, DOCX, PPT, PPTX o ZIP. Máximo 25 MB."
          >
            <Input
              id="manual_marca"
              name="manual_marca"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.zip"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.setCustomValidity(
                  file && file.size > MAX_MANUAL_SIZE ? "El archivo no puede superar 25 MB." : "",
                );
                event.currentTarget.reportValidity();
              }}
            />
          </Field>
        </CardBody>
      </Card>
      <div className="flex flex-wrap justify-end gap-3">
        <Link
          to={cliente ? `/clientes/${cliente.id}` : "/clientes"}
          className={buttonClasses({ variant: "secondary" })}
        >
          Cancelar
        </Link>
        <Button type="submit" loading={busy}>
          {cliente ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </Form>
  );
}
