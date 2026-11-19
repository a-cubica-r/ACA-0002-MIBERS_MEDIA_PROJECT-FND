# Contrato de la API — Módulo 2: Piezas

Base `/api/v1`, sin slash final. Bearer obligatorio, ADMIN y STAFF salvo aprobación y solicitud de cambios (solo ADMIN). Fuente: `modules/content/{models,serializers,views,services,state_machine,media_rules}.py` y `modules/publishing/{views,serializers,services}.py`.

## Ficha y lista

- `GET piezas?cliente=&estado=&tipo=&red=&desde=&hasta=&search=&page=&page_size=` → `{count,next,previous,results: PiezaResumen[]}`. Estado admite valores separados por coma; fechas YYYY-MM-DD con límites en Bogotá. Página 25, máximo 100.
- `POST piezas` → 201 Pieza. `cliente` UUID y `tipo` obligatorios; inicialmente BORRADOR. Resto opcional: `titulo` (200), `programada_para` ISO o null, `copy_comun`, `hashtags: string[]` (100 por tag), `enlaces: URL[]`, `campana` (150), `responsable` UUID activo o null, `mensaje_cliente`, `redes: {red,copy?}[]`. Responsable omitido = usuario actual, también STAFF. Hashtags normalizados con # y sin espacios.
- `GET piezas/{id}` → Pieza; `PATCH piezas/{id}` mismos campos parciales excepto cliente (inmutable). `DELETE piezas/{id}` → 204, solo BORRADOR.

Tipos: POST, CARRUSEL, REEL, HISTORIA, PORTADA. Redes INSTAGRAM, FACEBOOK, sin duplicados. `copy` vacío usa `copy_comun`; `copy_final` agrega hashtags. La ficha incluye id, cliente, cliente_nombre, titulo, tipo, estado, programada_para, redes `{red,copy,copy_final}[]`, copy_comun, hashtags, enlaces, campana, responsable, responsable_username, mensaje_cliente, archivos, tiene_archivo_editable, archivo_editable_nombre, created_at, updated_at. Lista: PiezaResumen del módulo 1 (redes string[], archivos_count).

## Archivos

- `POST piezas/{id}/archivos` multipart `{archivo}` → 201 ArchivoPieza; subir uno por solicitud, máximo 10.
- `PUT piezas/{id}/archivos/orden` JSON `{ids: UUID[]}` → Pieza. Debe incluir exactamente todos los archivos.
- `DELETE piezas/{id}/archivos/{archivoId}` → 204.
- `GET archivos/{archivoId}` → binario privado, usar fetch autenticado y objectURL.
- `POST piezas/{id}/archivo-editable` multipart `{archivo}` → Pieza; GET misma URL → binario. Máximo 500 MB. Extensiones psd, ai, fig, svg, indd, xd, pdf, zip, eps, sketch, png, jpg, jpeg, mp4, mov, prproj, aep, pptx, docx. Cambiar editable no devuelve a revisión.

ArchivoPieza: id, nombre_original, orden, kind (image/video), formato, tamano bytes, ancho, alto, duracion segundos/null, url privada.

JPG/PNG y MP4/MOV inspeccionados por backend (no basta extensión). Relación ancho/alto. Instagram: POST/CARRUSEL imágenes .8–1.91, ancho ≥320; REEL video .5–1, 3–90 s; HISTORIA .5–.65, ancho ≥320, video 3–60 s; PORTADA imagen .9–1.1, ancho ≥110. Facebook: POST .4–2.5, video 1–3600 s; CARRUSEL imágenes .4–2.5; REEL video .5–.65, 3–90 s; HISTORIA .5–.65, ancho ≥320, video 1–120 s; PORTADA imagen 2.3–2.8, ancho ≥400. Imágenes IG ≤8 MB, FB ≤10 MB; video IG ≤300 MB y FB POST ≤1024 MB (otros FB ≤300 MB). Carrusel 2–10 archivos, demás exactamente 1 al revisar. Se valida cada archivo al subir contra todas las redes seleccionadas y conjunto al revisar/programar.

## Revisión y estados

- `POST piezas/{id}/enviar-revision` → Pieza; BORRADOR/CAMBIOS_SOLICITADOS → EN_REVISION. Exige cliente activo, redes, fecha/hora, copy final por red y conjunto de archivos válido.
- `POST piezas/{id}/aprobar` `{comentario?:string}` → Pieza, solo ADMIN, EN_REVISION → APROBADA; verifica requisitos otra vez.
- `POST piezas/{id}/solicitar-cambios` `{comentario:string}` obligatorio no vacío, solo ADMIN; EN_REVISION → CAMBIOS_SOLICITADOS.
- `GET piezas/{id}/revisiones` → `{id,decision,comentario,autor,autor_username,created_at}[]`. Decisiones ENVIADA, APROBADA, CAMBIOS, DEVUELTA.

PUBLICADA y COMPARTIDA no editables. Tipo solo cambia en BORRADOR/CAMBIOS_SOLICITADOS. Cambios reales en archivos (incluido orden) o copy final compartido de APROBADA/PROGRAMADA/FALLIDA → EN_REVISION y registro DEVUELTA. Cancelan tareas pendientes mediante señales.

## Programación con confirmación

- `GET piezas/{id}/programacion` → `{pieza:PiezaResumen,cliente:string,programada_para,redes:{red,cuenta:CuentaSocial|null,copy_final}[],archivos:string[],problemas:string[],puede_confirmar:boolean}`. Mostrar antes de confirmar.
- `POST piezas/{id}/programar` `{confirmar:true}` → Pieza PROGRAMADA. Solo APROBADA, fecha futura y cuenta VINCULADA del mismo cliente por cada red; vuelve a validar preparación.
- `POST piezas/{id}/cancelar-programacion` → Pieza APROBADA. Solo PROGRAMADA, ninguna tarea publicada.

Fechas almacenadas UTC; UI interpreta datetime-local explícitamente con offset Colombia -05:00.

## Errores

Formato uniforme `{code,detail}` como módulo 1; detail string, lista de mensajes o objeto de campos. Renderizar mensajes del backend. Códigos: validation_error, client_inactive, client_locked, piece_locked (409), type_locked (409), not_draft (409), invalid_transition (409), piece_incomplete, admin_required (403), comment_required, too_many_files, invalid_order, invalid_editable, editable_too_large, invalid_media, confirmation_required, not_approved (409), cannot_schedule, not_scheduled (409), already_published (409). Permisos HTTP 403 y recurso inexistente 404.
