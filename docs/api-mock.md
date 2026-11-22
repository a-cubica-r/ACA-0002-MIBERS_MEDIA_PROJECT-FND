# Contrato propuesto: tareas, supervisión y portal

## Estado actual

Tareas y supervisión usan `app/lib/mock/store.ts`. Las funciones async de `app/lib/api/tareas.ts` permiten sustituirlo por HTTP sin cambiar la UI. Colecciones tipadas: tareas y personas; bandera de semilla única, IDs `crypto.randomUUID()`, latencia de 150 ms. Persistencia en `localStorage` (`mibers.mock.v1`) con fallback en memoria ante bloqueo, corrupción o cuota agotada. La tarea semilla se crea al abrir el módulo con el primer cliente real disponible y el usuario actual; nunca se inventan IDs de clientes o piezas.

Al iniciar sesión se guarda el usuario actual y, para ADMIN, el directorio de usuarios activos (`GET /usuarios?is_active=true`). También se actualiza al abrir tareas/equipo. STAFF nunca consulta `/usuarios`: solo puede asignar a personas ya guardadas en este navegador, como mínimo a sí mismo. Si falla la consulta opcional al ingresar, la sesión continúa. Backend pendiente: un directorio mínimo de personas asignables accesible al personal.

El mock se comparte entre sesiones del mismo origen/navegador; no sincroniza computadores y no proporciona seguridad de servidor. Revalida con eventos de storage, al enfocar y cada 15 segundos. La migración requiere polling autorizado o eventos del servidor. Todas las vistas mock lo anuncian; no se almacenan contraseñas en el mock.

## Tareas

Endpoints sugeridos bajo `/api/v1`:

- `GET /tareas?asignado_a=&cliente=&vencidas=&estado=`: listado paginado, ADMIN y STAFF.
- `POST /tareas`: crear, ambos roles.
- `GET /tareas/{id}`: consultar.
- `PATCH /tareas/{id}`: ADMIN edita todas; STAFF solo las asignadas a sí mismo y no puede reasignarlas.
- `GET /personas-asignables`: usuarios activos `{id,nombre}`, sin datos sensibles, ambos roles.

Objeto: `id` UUID, `titulo` requerido (máx. 200), `descripcion` (máx. 5000), `cliente_id` UUID real requerido, `pieza_id` UUID nullable del mismo cliente, `asignado_a: {id,nombre}`, `creado_por: {id,nombre}`, `fecha_limite` YYYY-MM-DD, `prioridad` BAJA/MEDIA/ALTA, `estado` PENDIENTE/EN_PROGRESO/EN_REVISION/COMPLETADA, `created_at` ISO y `completada_at` ISO nullable.

POST acepta campos editables; servidor fija ID, creador y timestamps. PATCH admite campos parciales. Completar fija `completada_at`; reabrir la borra. Validar referencias, usuario activo, permisos y enums; 400 por datos inválidos, 403 por permisos, 404 por referencia inexistente. El mock aplica permisos en su API además de ocultar controles.

## Supervisión (ADMIN)

Puede calcularse sobre tareas o servirse por `GET /equipo/resumen`, exclusivo ADMIN. Vencida: plazo anterior a hoy en America/Bogota y no completada. Abiertas: no completadas. Completadas recientes: timestamp dentro de los últimos siete días hasta ahora. Carga: abiertas por persona / máximo de abiertas del equipo, porcentaje relativo (no horas ni capacidad). Avance: completadas / total por cliente, cero cuando no hay tareas. Incluye personas y clientes sin tareas.

## Vista previa del portal (datos reales)

`/portal/:clienteId` está fuera del layout pero exige `requireUser`; no hay acceso anónimo ni rol cliente ficticio. Usa `GET /clientes/{id}`, `GET /piezas?cliente={id}` (todas las páginas), y directamente `GET /metricas?cliente={id}&desde=YYYY-MM&hasta=YYYY-MM` del mes calendario anterior. Muestra redes/estado, alcance por red y hasta 20 publicaciones futuras con fecha, tipo, redes y estado simplificado. Ausencia de métricas: "Sin datos disponibles"; error: aviso sin inventar cifras. Sin edición; enlace de vuelta exclusivo de vista previa.

Backend pendiente: rol CLIENTE y vínculo usuario-cliente, login y recuperación de contraseña, permisos de lectura restringidos por vínculo (sin clientes ajenos, usuarios, mutaciones ni archivos internos) y `GET /portal/resumen` con `{cliente: {id,nombre}, redes: [{red,handle,estado}], mes, alcance: [{red,valor}], proximas_publicaciones: [{id,titulo,tipo,fecha,redes,estado}]}`. Derivar cliente de la sesión, sin aceptar IDs arbitrarios. Filtrar estados/campos publicables en servidor y definir qué piezas en preparación puede conocer el cliente. Sustituir el guard interno cuando exista este flujo; no publicar las APIs internas actuales.
