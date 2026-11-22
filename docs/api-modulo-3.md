# Módulo 3: Métricas y analítica

Contrato verificado en `mibers-api/modules/metrics/{urls,views,models,services}.py`.
Base `/api/v1`, autenticación Bearer. Sin exportación (RF23).

## Consulta (ADMIN y STAFF)

`GET /metricas?cliente=<uuid>&red=INSTAGRAM|FACEBOOK&desde=AAAA-MM&hasta=AAAA-MM&page=1&page_size=100`

Todos los filtros son opcionales; fechas inclusivas. Una red desconocida se ignora.
Paginación: `{count, next, previous, results}`; 25 filas por defecto, máximo 100 por página.
Orden: mes descendente y red. El frontend recorre todas las páginas para informes completos.

Cada fila contiene:

```json
{
  "id": "uuid",
  "cliente": "uuid",
  "cliente_nombre": "Café La Montaña",
  "red": "INSTAGRAM",
  "mes": "2026-10",
  "alcance": 18200,
  "visualizaciones": 31000,
  "interacciones": 1260,
  "seguidores": 2840,
  "origen": "MANUAL",
  "sincronizado_at": null,
  "registrado_por_username": "director",
  "updated_at": "ISO-8601"
}
```

Los cuatro indicadores son enteros no negativos o `null` (no disponible).
Los meses son `AAAA-MM`, aunque la base almacena el primer día del mes.

## Registro y corrección (ADMIN y STAFF)

`PUT /clientes/{uuid}/metricas`

```json
{
  "red": "INSTAGRAM",
  "mes": "2026-10",
  "alcance": 18200,
  "visualizaciones": 31000,
  "interacciones": 1260,
  "seguidores": 2840
}
```

`red` y `mes` obligatorios; los cuatro indicadores opcionales y anulables. No se
permiten meses futuros. Un registro es único por cliente, red y mes. Responde
201 al crear y 200 al actualizar, con la fila completa. La actualización conserva
los campos omitidos y cambia el origen a MANUAL, borrando la fecha de sincronización.
El formulario envía los cuatro campos, con `null` al vaciar uno existente, y hace una
petición por red con datos o un registro previo. Las dos llamadas no son una transacción;
si falla la segunda, la UI informa que la primera ya quedó guardada.

Errores: envoltura común `{code, detail}`; `detail` puede ser un objeto de listas
por campo (`mes`, `red`, `alcance`, etc.). Se muestran junto al campo correspondiente.

## Sincronización opcional (solo ADMIN)

`POST /clientes/{uuid}/metricas/sincronizar` con `{"mes":"2026-11"}`.
Mes opcional (actual por defecto). Responde una lista de filas sincronizadas.
Respeta los registros MANUAL; la vista no permite forzar su sobrescritura.
Puede devolver `[]` si Meta no está configurado, no hay token/cuentas o los registros
son manuales. Esa respuesta no prueba que se hayan obtenido datos nuevos.
Seguidores históricos conservan el valor previo cuando existe. El alcance de Instagram
puede ser aproximado por la suma de ventanas. Se reportan errores de campos de Meta
como valores nulos sin abortar necesariamente toda la sincronización.

## Informe y cálculos

Periodo móvil de 6 o 12 meses, incluido el actual en Colombia. Cliente activo por
defecto: primero del listado. KPIs del último mes con datos y comparación contra su
mes calendario anterior, solo con la misma cobertura de redes. Variación:
`(actual - anterior) / anterior * 100`. Base cero o nula: sin comparación.
Tasa: `interacciones / alcance * 100`; alcance cero o dato nulo: sin dato.
Las sumas son nulas si un campo de una fila es nulo. Al sumar redes se informa que
el total no representa personas únicas. Tabla mensual y tablas alternativas a gráficas.

## Análisis asistido por IA (retirado)

El análisis asistido por IA (HU-26 / RF24) **se retiró el 22/11/2026 por estar fuera del alcance del Acta 3**. Se
eliminaron `app/lib/mock/analisis.ts`, la ruta `/metricas/analisis` y su pestaña. Este módulo no consume ningún endpoint
de IA.

## Verificación local (2026-11-20)

En `http://localhost:8000/api/v1` se registraron 12 filas nuevas mediante PUT
para Café La Montaña (`ceb62bf7-ef2b-416f-9896-970884c1df3e`): junio a noviembre
2026, Instagram y Facebook. La carga omitió cualquier clave red/mes preexistente.
GET devolvió las 12 filas; con filtro Instagram devolvió 6. STAFF pudo consultar
(200) y no sincronizar (403). Un PUT de mes 2099-01 devolvió 400 con error `mes`.
La sincronización real con Meta queda sujeta a credenciales/configuración del backend.
