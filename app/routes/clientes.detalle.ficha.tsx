import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { descargarManualMarca } from "~/lib/api/clientes";
import { ApiError } from "~/lib/api/errors";
import { ESTRATEGIA_LABEL, formatDate } from "~/lib/format";
import { useCliente } from "~/features/clientes/use-cliente";
import {
  Alert,
  Button,
  buttonClasses,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
} from "~/components/ui";
export const meta = () => [{ title: "Ficha del cliente · Mibers" }];
export function contractRemaining(end: string | null, now = new Date()): string {
  if (!end) return "Sin fecha fin";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((value) => value.type === name)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const days = Math.round((Date.parse(end) - Date.parse(today)) / 86400000);
  return days < 0 ? "Vencido" : days === 0 ? "Vence hoy" : `${days} días restantes`;
}
export default function ClienteFicha() {
  const cliente = useCliente();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      const { blob, filename } = await descargarManualMarca(cliente.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (error instanceof ApiError) setError(error.message);
      else if (error instanceof Response && error.headers.get("Location")) {
        await navigate(error.headers.get("Location")!);
      } else throw error;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Contacto principal" />
        <CardBody>
          <dl className="space-y-3 break-words">
            <div>
              <dt className="text-ink-muted text-sm">Nombre</dt>
              <dd>{cliente.contacto_nombre || "Sin registrar"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm">Teléfono</dt>
              <dd>{cliente.contacto_telefono || "Sin registrar"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted text-sm">Correo electrónico</dt>
              <dd>{cliente.contacto_email || "Sin registrar"}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Contrato y plan" />
        <CardBody className="space-y-3">
          <p className="text-xl font-semibold">{cliente.posts_por_semana} posts/semana</p>
          <p>
            {formatDate(cliente.contrato_inicio)} –{" "}
            {cliente.contrato_fin ? formatDate(cliente.contrato_fin) : "Sin fecha fin"}
          </p>
          <p className="text-ink-muted text-sm">{contractRemaining(cliente.contrato_fin)}</p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Estrategia y objetivo" />
        <CardBody className="space-y-3">
          <p className="font-medium">{ESTRATEGIA_LABEL[cliente.estrategia]}</p>
          <p className="text-sm break-words whitespace-pre-wrap">
            {cliente.objetivo || "Sin objetivo registrado."}
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Manual de marca" />
        <CardBody>
          {error && (
            <Alert tone="danger" className="mb-3">
              {error}
            </Alert>
          )}
          {cliente.tiene_manual_marca ? (
            <div className="space-y-4">
              <p className="text-sm break-all">{cliente.manual_marca_nombre}</p>
              <Button onClick={download} loading={busy}>
                Descargar manual
              </Button>
            </div>
          ) : (
            <EmptyState
              title="Sin manual de marca"
              description="Adjunta el manual para tenerlo a mano."
              action={
                <Link
                  to={`/clientes/${cliente.id}/editar`}
                  className={buttonClasses({ variant: "secondary" })}
                >
                  Editar cliente
                </Link>
              }
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
