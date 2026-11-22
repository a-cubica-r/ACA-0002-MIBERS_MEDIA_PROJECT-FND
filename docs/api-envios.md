# Envíos al cliente (HU-19, RF18)

Registro de las piezas que se envían por WhatsApp a los contactos autorizados de cada cliente. Lo implementa el
backend (`mibers-api`); el frontend solo lo consulta. Base `/api/v1`, autenticación Bearer, ADMIN y STAFF.

## Endpoints

- `GET envios?cliente=&pieza=&estado=&desde=&hasta=&page=&page_size=` → `Paginated<Envio>`
  (`{count, next, previous, results}`). Todos los filtros son opcionales; `desde` y `hasta` son fechas
  `AAAA-MM-DD` (día de Colombia). El frontend pide 25 por página.
- `GET piezas/{id}/envios` → `Envio[]` (sin paginar), los envíos de una pieza.

## Forma del envío

```ts
type EstadoEnvio = "PENDIENTE" | "ENVIADO" | "ENTREGADO" | "LEIDO" | "FALLIDO";
interface Envio {
  id: string;
  pieza: { id: string; titulo: string; tipo: TipoPieza };
  cliente: { id: string; nombre: string };
  contacto: { id: string; nombre: string };
  numero: string; // enmascarado por el backend, p. ej. "•••• 1234"
  archivo: { id: string; nombre: string; kind: "image" | "video" } | null;
  estado: EstadoEnvio;
  error: string; // motivo cuando estado = FALLIDO
  enviado_at: string | null; // ISO
  entregado_at: string | null; // ISO
  created_at: string; // ISO
}
```

**Privacidad:** el frontend nunca muestra ni pide el número completo; usa `numero` tal como llega.

## Uso en el frontend

- `app/lib/api/envios.ts`: `listEnvios(filtros)` y `listEnviosPieza(piezaId)`; tipos en `app/lib/api/types.ts`.
- Ruta `/envios` ("Envíos al cliente", en el menú para Administrador y Personal): tabla con fecha, cliente, pieza
  (enlace al detalle), contacto, número enmascarado, archivo, estado, enviado y entregado; filtros por cliente,
  estado y rango de fechas en la URL; paginación.
- Detalle de la pieza (`/piezas/:piezaId`): sección "Envíos al cliente" con `piezas/{id}/envios`. Se muestra si la
  pieza está `PUBLICADA` o `COMPARTIDA`, o si ya tiene envíos. Si el endpoint falla, la pieza se sigue viendo y la
  sección muestra el error.

| Estado    | Etiqueta  | Insignia                                   |
| --------- | --------- | ------------------------------------------ |
| PENDIENTE | Pendiente | Neutra                                     |
| ENVIADO   | Enviado   | Info                                       |
| ENTREGADO | Entregado | Éxito                                      |
| LEIDO     | Leído     | Éxito                                      |
| FALLIDO   | Fallido   | Peligro, con `error` como texto secundario |
