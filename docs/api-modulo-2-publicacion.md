# Contrato de cronograma y publicación

Fuente: `modules/content/{views,selectors,serializers}.py`, `modules/publishing/{models,serializers,views,services}.py` del backend local. Base `/api/v1`, JWT mediante `apiFetch`; acceso ADMIN y STAFF.

## Cronograma

`GET clientes/{uuid}/cronograma?vista=semana|mes&fecha=YYYY-MM-DD&red=INSTAGRAM|FACEBOOK&estado=<EstadoPieza>`.
La semana empieza el lunes; mes devuelve solo los días del mes. Fechas y agrupación en America/Bogota. Respuesta `{vista, desde, hasta, dias: [{fecha, piezas: PiezaResumen[]}]}`; límites inclusivos. Solo incluye piezas con `programada_para` dentro del período (también borradores con fecha). Filtros red y estado en servidor. Cada resumen contiene id, cliente, cliente_nombre, titulo, tipo, estado, programada_para, redes (strings), archivos_count, responsable y responsable_username.

Selector: `GET clientes?activo=true&page_size=100&page=N`, respuesta paginada `{count,next,previous,results}`. Se recorren todas las páginas de clientes activos.

## Publicaciones

El README, sección «la agencia no es Tech Provider», define publicación manual asistida: al vencer la programación el scheduler crea una tarea por red, el personal publica fuera de Mibers, confirma el enlace o reporta el fallo y puede reintentar. El modelo actual también incluye `modo=MANUAL|AUTOMATICA` y diagnóstico externo; la UI identifica el modo recibido sin prometer publicación automática.

`GET publicaciones?estado=PENDIENTE|PUBLICADA|FALLIDA|CANCELADA&page=N` devuelve paginación de 25. Omitir estado lista todas. También admite cliente, red, desde y hasta; estado admite valores separados por coma.
`GET publicaciones/{id}` devuelve una tarea.
Campos: id, pieza (UUID), pieza_titulo, pieza_tipo, cliente, cliente_nombre, red, cuenta_handle, cuenta_url, estado, copy_final, programada_para, avisada_at, enlace, motivo, publicada_at, gestionada_por, gestionada_por_username, intentos, modo, externo_contenedor_id, externo_post_id, externo_estado.

- `POST publicaciones/{id}/confirmar`, JSON `{enlace: URL}` (máximo 500). La UI requiere HTTP(S) válida; el servicio exige HTTPS y dominio de la misma red (incluidos subdominios) y devuelve `invalid_link` si no coincide.
- `POST publicaciones/{id}/fallar`, JSON `{motivo: string}`. El serializer permite vacío pero el servicio lo rechaza; la UI exige motivo.
- `POST publicaciones/{id}/reintentar`, sin cuerpo. Devuelve tarea pendiente.

Las tres mutaciones devuelven la tarea actualizada. Las reglas de transición las aplica el servidor; errores mediante ApiError. `publicada_at` solo fecha publicación; no se inventa fecha de fallo porque no se expone.

La tarea no incluye archivos. Para descargar se consulta bajo demanda `GET piezas/{pieza}`, se extraen `archivos: [{id,nombre_original,url,...}]` y se descarga con JWT mediante `apiDownload('archivos/{id}')`, que corresponde al endpoint autenticado de `url`. Nunca se abre directamente un archivo protegido sin autorización. Las piezas enlazan a `/piezas/{id}`.
