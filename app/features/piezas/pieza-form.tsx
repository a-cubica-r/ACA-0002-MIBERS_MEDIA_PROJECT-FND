import { useState } from "react";
import { Form, Link, useNavigation } from "react-router";
import { Alert, Button, Field, Input, Select, Textarea } from "~/components/ui";
import type { Cliente, Usuario } from "~/lib/api/types";
import type { Pieza } from "~/lib/api/piezas";
import { RED_LABEL, TIPO_PIEZA_LABEL } from "~/lib/format";
import { isoToColombia, NETWORKS, TYPES } from "./schemas";
export interface FormResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}
export function PiezaForm({
  pieza,
  clientes,
  usuarios,
  clienteId,
  result,
}: {
  pieza?: Pieza;
  clientes: Cliente[];
  usuarios: Usuario[];
  clienteId?: string;
  result?: FormResult;
}) {
  const [networks, setNetworks] = useState<string[]>(pieza?.redes.map((r) => r.red) ?? []);
  const [distinct, setDistinct] = useState(pieza?.redes.some((r) => r.copy) ?? false);
  const busy = useNavigation().state !== "idle";
  const errors = result?.fieldErrors;
  const reviewed = pieza && ["APROBADA", "PROGRAMADA", "FALLIDA"].includes(pieza.estado);
  return (
    <Form method="post" className="space-y-5">
      {result?.error && <Alert tone="danger">{result.error}</Alert>}
      {reviewed && (
        <Alert tone="warning">
          Cambiar el copy o los archivos devuelve la pieza a revisión y cancela su programación.
          Revisa los cambios antes de guardar.
        </Alert>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Cliente" htmlFor="cliente" error={errors?.cliente} required>
          {pieza ? (
            <>
              <Input id="cliente" value={pieza.cliente_nombre} readOnly />
              <input type="hidden" name="cliente" value={pieza.cliente} />
            </>
          ) : (
            <Select id="cliente" name="cliente" defaultValue={clienteId ?? ""} required>
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {!c.activo ? " (inactivo)" : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Título" htmlFor="titulo" error={errors?.titulo}>
          <Input id="titulo" name="titulo" maxLength={200} defaultValue={pieza?.titulo} />
        </Field>
        <Field label="Tipo" htmlFor="tipo" error={errors?.tipo}>
          <Select
            id="tipo"
            name="tipo"
            defaultValue={pieza?.tipo ?? "POST"}
            disabled={!!pieza && !["BORRADOR", "CAMBIOS_SOLICITADOS"].includes(pieza.estado)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TIPO_PIEZA_LABEL[t]}
              </option>
            ))}
          </Select>
          {pieza && !["BORRADOR", "CAMBIOS_SOLICITADOS"].includes(pieza.estado) && (
            <input type="hidden" name="tipo" value={pieza.tipo} />
          )}
        </Field>
        <Field
          label="Fecha y hora de Colombia"
          htmlFor="programada_para"
          required
          error={errors?.programada_para}
        >
          <Input
            type="datetime-local"
            id="programada_para"
            name="programada_para"
            defaultValue={isoToColombia(pieza?.programada_para ?? null)}
            required
          />
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className="font-medium">Redes destino *</legend>
        <input type="hidden" name="redes" value={networks.join(",")} />
        <div className="flex gap-5">
          {NETWORKS.map((red) => (
            <label key={red} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={networks.includes(red)}
                onChange={(e) =>
                  setNetworks(
                    e.target.checked ? [...networks, red] : networks.filter((r) => r !== red),
                  )
                }
              />
              {RED_LABEL[red]}
            </label>
          ))}
        </div>
        {errors?.redes && (
          <p role="alert" className="text-danger-700">
            {errors.redes}
          </p>
        )}
      </fieldset>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={distinct} onChange={(e) => setDistinct(e.target.checked)} />
        Copy distinto por red
      </label>
      <input name="distinto" type="hidden" value={String(distinct)} />
      <Field label="Copy común" htmlFor="copy_comun" error={errors?.copy_comun}>
        <Textarea
          id="copy_comun"
          name="copy_comun"
          rows={4}
          defaultValue={pieza?.copy_comun}
          required={!distinct}
        />
      </Field>
      {distinct &&
        NETWORKS.filter((r) => networks.includes(r)).map((red) => (
          <Field
            key={red}
            label={`Copy para ${RED_LABEL[red]}`}
            htmlFor={red}
            error={errors?.[red]}
            required
          >
            <Textarea
              id={red}
              name={red}
              rows={4}
              required
              defaultValue={pieza?.redes.find((r) => r.red === red)?.copy || pieza?.copy_comun}
            />
          </Field>
        ))}
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Hashtags"
          htmlFor="hashtags"
          hint="Separados por espacios o comas."
          error={errors?.hashtags}
        >
          <Input id="hashtags" name="hashtags" defaultValue={pieza?.hashtags.join(" ")} />
        </Field>
        <Field label="Campaña" htmlFor="campana" error={errors?.campana}>
          <Input id="campana" name="campana" maxLength={150} defaultValue={pieza?.campana} />
        </Field>
      </div>
      <Field
        label="Enlaces"
        htmlFor="enlaces"
        hint="Un enlace completo por línea."
        error={Object.entries(errors ?? {}).find(([k]) => k.startsWith("enlaces"))?.[1]}
      >
        <Textarea id="enlaces" name="enlaces" defaultValue={pieza?.enlaces.join("\n")} />
      </Field>
      {usuarios.length > 0 ? (
        <Field label="Responsable" htmlFor="responsable">
          <Select
            id="responsable"
            name="responsable"
            defaultValue={pieza ? (pieza.responsable ?? "") : usuarios[0]?.id}
          >
            <option value="">Sin asignar</option>
            {pieza?.responsable && !usuarios.some((u) => u.id === pieza.responsable) && (
              <option value={pieza.responsable} disabled>
                {pieza.responsable_username} (inactivo)
              </option>
            )}
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <p className="text-ink-muted text-sm">
          Responsable: {pieza?.responsable_username || "se asignará a tu usuario"}.
        </p>
      )}
      <Field
        label="Mensaje para el cliente"
        htmlFor="mensaje_cliente"
        error={errors?.mensaje_cliente}
      >
        <Textarea
          id="mensaje_cliente"
          name="mensaje_cliente"
          defaultValue={pieza?.mensaje_cliente}
        />
      </Field>
      {!pieza && (
        <Alert>
          Al crear la pieza podrás subir los archivos y enviarla a revisión desde su detalle.
        </Alert>
      )}
      <div className="flex gap-3">
        <Button type="submit" loading={busy}>
          {pieza ? "Guardar cambios" : "Crear pieza y agregar archivos"}
        </Button>
        <Link to={pieza ? `/piezas/${pieza.id}` : "/piezas"}>Cancelar</Link>
      </div>
    </Form>
  );
}
