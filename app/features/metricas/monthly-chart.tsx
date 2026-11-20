import { Card, CardBody, CardHeader, Table, THead, TBody, TR, TH, TD } from "~/components/ui";
import type { Metrica } from "~/lib/api/metricas";
import { RED_LABEL } from "~/lib/format";
import { numberLabel } from "./calculos";
export function MonthlyChart({
  rows,
  months,
  field,
  title,
}: {
  rows: Metrica[];
  months: string[];
  field: "alcance" | "seguidores";
  title: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row[field] ?? 0));
  return (
    <Card>
      <CardHeader
        title={title}
        description="Instagram: barra sólida · Facebook: barra atenuada. Los espacios sin barra pueden indicar cero o un dato no disponible; consulta la tabla."
      />
      <CardBody>
        <svg
          viewBox={`0 0 ${months.length * 90} 240`}
          role="img"
          aria-label={`${title} por mes y red`}
          className="w-full"
        >
          <title>{title} por mes y red. Datos disponibles en la tabla alternativa.</title>
          {months.map((month, i) => (
            <g key={month}>
              {(["INSTAGRAM", "FACEBOOK"] as const).map((red, j) => {
                const value =
                  rows.find((row) => row.mes === month && row.red === red)?.[field] ?? null;
                const height = ((value ?? 0) / max) * 185;
                return (
                  <rect
                    key={red}
                    x={i * 90 + 15 + j * 26}
                    y={205 - height}
                    width="22"
                    height={height}
                    rx="3"
                    className={j === 0 ? "fill-brand-600" : "fill-brand-600/40"}
                  >
                    <title>
                      {month}, {RED_LABEL[red]}: {numberLabel(value)}
                    </title>
                  </rect>
                );
              })}
              <text
                x={i * 90 + 40}
                y="228"
                textAnchor="middle"
                className="fill-ink-muted"
                fontSize="11"
              >
                {month}
              </text>
            </g>
          ))}
        </svg>
        <details className="mt-4">
          <summary className="text-brand-700 cursor-pointer text-sm">
            Ver tabla de datos de {title.toLowerCase()}
          </summary>
          <Table>
            <THead>
              <TR>
                <TH>Mes</TH>
                <TH>Instagram</TH>
                <TH>Facebook</TH>
              </TR>
            </THead>
            <TBody>
              {months.map((month) => (
                <TR key={month}>
                  <TD>{month}</TD>
                  {(["INSTAGRAM", "FACEBOOK"] as const).map((red) => (
                    <TD key={red}>
                      {numberLabel(
                        rows.find((row) => row.mes === month && row.red === red)?.[field] ?? null,
                      )}
                    </TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>
        </details>
      </CardBody>
    </Card>
  );
}
