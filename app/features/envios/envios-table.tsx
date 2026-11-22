import { Link } from "react-router";
import {
  Badge,
  Card,
  CardBody,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  type BadgeTone,
} from "~/components/ui";
import type { Envio, EstadoEnvio } from "~/lib/api/types";
import { ESTADO_ENVIO_LABEL, formatDateTime } from "~/lib/format";

export const ESTADO_ENVIO_TONE: Record<EstadoEnvio, BadgeTone> = {
  PENDIENTE: "neutral",
  ENVIADO: "info",
  ENTREGADO: "success",
  LEIDO: "success",
  FALLIDO: "danger",
};

/** Estado del envío; si falló, muestra el motivo como texto secundario. */
export function EstadoEnvioBadge({ envio }: { envio: Envio }) {
  return (
    <div className="space-y-1">
      <Badge tone={ESTADO_ENVIO_TONE[envio.estado]}>{ESTADO_ENVIO_LABEL[envio.estado]}</Badge>
      {envio.estado === "FALLIDO" && envio.error && (
        <p className="text-danger-700 text-xs break-words">{envio.error}</p>
      )}
    </div>
  );
}

const fecha = (iso: string | null) => (iso ? formatDateTime(iso) : "—");
const archivo = (envio: Envio) => envio.archivo?.nombre || "Sin archivo";
const PiezaLink = ({ envio }: { envio: Envio }) => (
  <Link to={`/piezas/${envio.pieza.id}`} className="text-brand-700 font-medium hover:underline">
    {envio.pieza.titulo}
  </Link>
);

/** Tabla en escritorio y tarjetas en móvil. `numero` se muestra tal como lo envía la API. */
export function EnviosTable({
  envios,
  showPieza = true,
}: {
  envios: Envio[];
  showPieza?: boolean;
}) {
  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <THead>
            <TR>
              <TH>Fecha</TH>
              <TH>Cliente</TH>
              {showPieza && <TH>Pieza</TH>}
              <TH>Contacto</TH>
              <TH>Número</TH>
              <TH>Archivo</TH>
              <TH>Estado</TH>
              <TH>Enviado</TH>
              <TH>Entregado</TH>
            </TR>
          </THead>
          <TBody>
            {envios.map((envio) => (
              <TR key={envio.id}>
                <TD className="whitespace-nowrap">{fecha(envio.created_at)}</TD>
                <TD>{envio.cliente.nombre}</TD>
                {showPieza && (
                  <TD>
                    <PiezaLink envio={envio} />
                  </TD>
                )}
                <TD>{envio.contacto.nombre}</TD>
                <TD className="whitespace-nowrap">{envio.numero}</TD>
                <TD className="break-all">{archivo(envio)}</TD>
                <TD>
                  <EstadoEnvioBadge envio={envio} />
                </TD>
                <TD className="whitespace-nowrap">{fecha(envio.enviado_at)}</TD>
                <TD className="whitespace-nowrap">{fecha(envio.entregado_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
      <ul className="grid gap-4 lg:hidden">
        {envios.map((envio) => (
          <li key={envio.id}>
            <Card>
              <CardBody className="space-y-2 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-ink font-medium">{fecha(envio.created_at)}</p>
                  <EstadoEnvioBadge envio={envio} />
                </div>
                {showPieza && (
                  <p>
                    <PiezaLink envio={envio} />
                  </p>
                )}
                <p className="text-ink-muted">
                  {envio.cliente.nombre} · {envio.contacto.nombre} · {envio.numero}
                </p>
                <p className="text-ink-muted break-all">Archivo: {archivo(envio)}</p>
                <p className="text-ink-muted text-xs">
                  Enviado: {fecha(envio.enviado_at)} · Entregado: {fecha(envio.entregado_at)}
                </p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
