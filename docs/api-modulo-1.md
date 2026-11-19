# Contrato de la API — Modulo 1

Base: `/api/v1` (en desarrollo, Vite reenvia `/api` al backend). JSON salvo donde se indique.
Autenticacion: `Authorization: Bearer <access>` en todo excepto `auth/login` y `auth/refresh`.
Fuente de verdad: `../mibers-api/modules/{accounts,clients,content}/` (serializers, views, services).

## Errores

Formato uniforme:

```json
{ "code": "invalid_credentials", "detail": "Usuario o contrasena incorrectos." }
{ "code": "validation_error", "detail": { "nombre": ["Este campo es requerido."], "contrato_fin": ["No puede ser anterior..."] } }
{ "code": "validation_error", "detail": ["Mensaje no asociado a un campo"] }
```

Si `detail` es objeto, son errores por campo (`non_field_errors` puede aparecer). Codigos relevantes:

| status | code                                      | Significado / reaccion en el frontend                                           |
| ------ | ----------------------------------------- | ------------------------------------------------------------------------------- |
| 401    | `invalid_credentials`                     | Login: usuario o contraseña incorrectos                                         |
| 423    | `account_locked`                          | Login: 5 intentos fallidos, bloqueada 15 min (RNF01)                            |
| 401    | `token_not_valid` / `not_authenticated`   | Access vencido: intentar `auth/refresh` una vez y repetir                       |
| 401    | `session_expired`                         | 30 min de inactividad (RNF01): limpiar sesion, ir a `/login?motivo=inactividad` |
| 401    | `session_revoked` / `invalid_token`       | Sesion cerrada: limpiar sesion, ir a `/login`                                   |
| 403    | `password_change_required`                | Usuario con contraseña temporal: ir a `/cambiar-contrasena`                     |
| 403    | `permission_denied`                       | Rol sin permiso                                                                 |
| 400    | `wrong_current_password`, `same_password` | Cambio de contraseña                                                            |
| 404    | `not_found`                               | Recurso inexistente                                                             |

## Sesion (RF1, RF2, RNF01)

Access dura 10 min, refresh 12 h (rota en cada uso: guardar el nuevo). Inactividad de 30 min la controla el servidor.

- `POST auth/login` `{username, password}` → `200 {access, refresh, user: Usuario}`
- `POST auth/refresh` `{refresh}` → `200 {access, refresh}` (401 `invalid_token`/`session_expired`/`session_revoked`)
- `POST auth/logout` `{refresh}` → `204`
- `GET auth/me` → `Usuario`
- `POST auth/change-password` `{current_password, new_password}` → `200 {detail}`. Minimo 10 caracteres, no
  demasiado comun ni parecida al usuario (validadores de Django; los errores llegan como `validation_error` con
  `detail` lista de strings). Revoca las **otras** sesiones; la actual sigue valida y `must_change_password` pasa a false.

`auth/me`, `auth/logout` y `auth/change-password` son las unicas rutas permitidas con `must_change_password = true`.

```ts
type Role = "ADMIN" | "STAFF"; // "Administrador" | "Personal"
interface Usuario {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  cargo: string; // cargo es informativo, no da permisos
  whatsapp_number: string | null; // E.164, para alertas (RF19)
  is_active: boolean;
  must_change_password: boolean;
  last_login: string | null;
  date_joined: string;
}
```

## Personal (solo ADMIN) — RF2, RF3

- `GET usuarios?is_active=true|false` → `Usuario[]` (sin paginar, ordenado por username)
- `POST usuarios` `{username, first_name?, last_name?, role?="STAFF", cargo?, whatsapp_number?}` →
  `201 Usuario & {temporary_password: string}`. **La contraseña temporal solo se muestra esta vez**: mostrarla
  destacada con boton de copiar y aviso de que debe entregarse al usuario. Username duplicado → error de campo.
- `GET usuarios/{id}` → `Usuario`
- `PATCH usuarios/{id}` `{first_name?, last_name?, role?, cargo?, whatsapp_number?}` → `Usuario`
  (`whatsapp_number` vacio o null lo borra)
- `POST usuarios/{id}/desactivar` → `Usuario` · `POST usuarios/{id}/activar` → `Usuario`
  (el admin no puede desactivarse a si mismo: llega `DomainError`)
- `POST usuarios/{id}/restablecer-password` → `{temporary_password}` (mismo tratamiento que al crear)

Telefonos E.164: `^\+[1-9]\d{7,14}$`, ej. `+573001112233`.

## Clientes (ADMIN y STAFF) — RF5, RF6, RF7

```ts
type Estrategia = "VIRALIZAR" | "POSICIONAR" | "VENDER";
type Red = "INSTAGRAM" | "FACEBOOK";
type EstadoCuenta = "VINCULADA" | "EXPIRADA" | "DESVINCULADA";
interface Contacto {
  id: string;
  cliente: string;
  nombre: string;
  numero: string;
  autorizado: boolean; // Ley 1581: sin autorizacion no se le envia nada
  autorizacion_at: string | null;
  autorizacion_evidencia: string;
}
interface CuentaSocial {
  id: string;
  cliente: string;
  red: Red;
  handle: string;
  url_perfil: string;
  id_externo: string;
  estado: EstadoCuenta;
  estado_actualizado_at: string;
}
interface Cliente {
  id: string;
  nombre: string;
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string;
  posts_por_semana: number; // plan contratado, 1..14
  contrato_inicio: string; // "YYYY-MM-DD"
  contrato_fin: string | null;
  estrategia: Estrategia;
  objetivo: string;
  tiene_manual_marca: boolean;
  manual_marca_nombre: string;
  activo: boolean;
  desactivado_at: string | null;
  contactos_whatsapp: Contacto[];
  cuentas: CuentaSocial[];
  created_at: string;
}
interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

- `GET clientes?activo=true|false&estrategia=&search=&page=&page_size=` → `Paginated<Cliente>` (25 por pagina, max 100)
- `POST clientes` → `201 Cliente`. JSON, o `multipart/form-data` si se adjunta `manual_marca` (archivo).
  Campos: `nombre`_, `contacto_nombre`, `contacto_telefono`, `contacto_email` (email valido), `posts_por_semana`_ (1-14),
  `contrato_inicio`* (fecha), `contrato_fin` (≥ inicio), `estrategia`*, `objetivo`, `manual_marca`
  (pdf, png, jpg, jpeg, doc, docx, ppt, pptx, zip; ≤ 25 MB). En multipart, `contrato_fin` vacio = omitirlo.
- `GET clientes/{id}` → `Cliente` · `PATCH clientes/{id}` (parcial, mismos campos, JSON o multipart) → `Cliente`
- `POST clientes/{id}/desactivar` | `reactivar` → `Cliente`. Desactivar conserva el historial 1 año (RF5): confirmar con aviso.
- `GET clientes/{id}/manual-marca` → archivo (requiere Bearer: descargar con fetch → blob → objectURL, no con `<a href>`)
- Contactos WhatsApp (RF6):
  - `GET clientes/{id}/contactos` → `Contacto[]`
  - `POST clientes/{id}/contactos` `{nombre, numero, autorizado: boolean, evidencia?}` → `201 Contacto`
  - `PATCH clientes/{id}/contactos/{contactoId}` `{nombre?, numero?, autorizado?, evidencia?}` → `Contacto`
  - `DELETE clientes/{id}/contactos/{contactoId}` → `204`
- Cuentas de redes (RF7; la agencia no es Tech Provider de Meta: la cuenta se **registra a mano**, sin contraseñas):
  - `GET clientes/{id}/cuentas` → `CuentaSocial[]` (todos)
  - `POST clientes/{id}/cuentas` `{red, handle, url_perfil, id_externo?}` → `201` (**solo ADMIN**; una cuenta por red)
  - `PATCH clientes/{id}/cuentas/{cuentaId}` `{handle?, url_perfil?, id_externo?, estado?}` (**solo ADMIN**)

## Empresas actuales (RF5, HU-06)

- `GET clientes/actuales` → arreglo, clientes activos por nombre:

```ts
interface EmpresaActual {
  cliente: Cliente;
  proximas_publicaciones: {
    // hasta 5, no publicadas, futuras
    id: string;
    cliente: string;
    cliente_nombre: string;
    titulo: string;
    tipo: "POST" | "CARRUSEL" | "REEL" | "HISTORIA" | "PORTADA";
    estado:
      | "BORRADOR"
      | "EN_REVISION"
      | "CAMBIOS_SOLICITADOS"
      | "APROBADA"
      | "PROGRAMADA"
      | "PUBLICADA"
      | "FALLIDA"
      | "COMPARTIDA";
    programada_para: string | null;
    redes: Red[];
    archivos_count: number;
    responsable: string | null;
    responsable_username: string;
  }[];
  pendientes: {
    borradores: number;
    en_revision: number;
    cambios_solicitados: number;
    aprobadas_sin_programar: number;
    fallidas: number;
  };
  semana_actual: { plan: number; programadas: number };
}
```

## Etiquetas para la UI

Estrategia: Viralizar, Posicionar, Vender · Red: Instagram, Facebook · Cuenta: Vinculada, Expirada, Desvinculada ·
Rol: Administrador, Personal · Pieza: Borrador, En revisión, Cambios solicitados, Aprobada, Programada, Publicada,
Fallida, Compartida · Tipo: Post, Carrusel, Reel, Historia, Portada.

## Fuera de alcance del frontend en este modulo

- **Vista de consulta para el cliente** (charter, Modulo 1): la API aun no tiene rol ni login de cliente. Pendiente de backend.
