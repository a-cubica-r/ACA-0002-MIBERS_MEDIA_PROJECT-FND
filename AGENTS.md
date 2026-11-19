# AGENTS.md — Mibers Web (frontend)

Frontend del aplicativo de Mibers Creativos (agencia de marketing digital). Consume la API Django de
`../mibers-api` (leer su `README.md` y `context.txt` si necesitas reglas de negocio). Estamos construyendo el
**Modulo 1: Administracion de Clientes y Usuarios**. Contrato de la API en `docs/api-modulo-1.md`.

## Reglas para agentes (obligatorias)

- **No hagas commits, ni `git add`, ni cambies la configuracion de git.** El lider del equipo revisa y hace los commits.
- Toca **solo** los archivos que tu tarea indique. Si necesitas cambiar algo compartido (`app/routes.ts`,
  `app/lib/**`, `app/components/ui/**`, `app/app.css`, `package.json`), no lo hagas: dejalo anotado en tu resumen final.
- No instales dependencias nuevas sin que la tarea lo autorice.
- Antes de terminar ejecuta `pnpm typecheck && pnpm lint && pnpm test` y deja todo en verde. Reporta la salida.
- Textos visibles al usuario **en espanol de Colombia, con tildes** ("Contraseña", "Sesión", "Revisión").
  Identificadores de codigo en ingles o en el dominio en espanol (`cliente`, `contacto`), sin tildes.

## Stack

- React Router v8 **modo framework, SPA** (`ssr: false`). Datos con `clientLoader` / `clientAction`
  (nunca `loader`/`action` de servidor). Tipos de ruta: `import type { Route } from "./+types/<archivo>"`.
- TypeScript estricto, React 19, Tailwind v4, `zod` para validar formularios, `clsx` para clases.
- Pruebas: Vitest + Testing Library (`*.test.ts(x)` junto al archivo). `pnpm` como gestor.
- Alias `~/` = `app/`.

## Estructura

```
app/
  routes.ts                 # mapa de rutas (lo mantiene el lider)
  routes/*.tsx              # modulos de ruta: clientLoader, clientAction, meta, componente. Delgados.
  lib/api/                  # cliente HTTP, errores, tipos y funciones por recurso (auth, usuarios, clientes)
  lib/auth/                 # tokens, sesion, guards (requireUser, requireAdmin)
  lib/format.ts             # fechas (America/Bogota), etiquetas de enums
  components/ui/            # primitivas visuales reutilizables (Button, Input, Modal...)
  components/layout/        # AppShell, navegacion
  features/<dominio>/       # componentes y esquemas zod de cada dominio (clientes, usuarios)
```

## Convenciones

- **Datos**: leer en `clientLoader` y mutar en `clientAction` con `<Form method="post">` o `useFetcher`.
  Varias acciones en una ruta: campo oculto `intent` (`<input type="hidden" name="intent" value="desactivar">`).
  Tras una mutacion, React Router revalida los loaders solo.
- **Errores**: las funciones de `~/lib/api` lanzan `ApiError` (`status`, `code`, `message`, `fieldErrors`).
  En un `clientAction`, captura `ApiError` y devuelve `{ ok: false, error: e.message, fieldErrors: e.fieldErrors }`
  para pintarlos en el formulario; no captures otros errores. Exito: `redirect(...)` o `{ ok: true, ... }`.
- **Permisos** (RF3): dos roles, `ADMIN` (Administrador / director) y `STAFF` (Personal). Solo ADMIN gestiona
  usuarios y registra/cambia cuentas de redes sociales. Ocultar en la UI lo que el rol no puede hacer **y**
  proteger la ruta con `requireAdmin`. Nunca dependen del `cargo`.
- **Estilos**: usa los tokens de `app/app.css` (`bg-surface`, `bg-canvas`, `text-ink`, `text-ink-muted`, `border-line`,
  `bg-brand-600`, `text-danger-700`...) y las primitivas de `~/components/ui`. Nada de colores crudos (`bg-purple-500`).
- **Responsivo** (RNF04): diseño principal para 1366 px y usable desde 360 px. Tablas: en movil se convierten
  en tarjetas o tienen scroll horizontal dentro de su contenedor; la pagina nunca hace scroll horizontal.
- **Accesibilidad**: cada input con `<label>`, botones con texto o `aria-label`, foco visible, `role="alert"` en errores.
- **Fechas**: la API envia ISO; mostrar en hora de Colombia con `~/lib/format`. Fechas puras (`YYYY-MM-DD`) no se
  convierten de zona.
- Componentes pequeños y legibles; sin comentarios obvios. Sin `any`.

## Comandos

```bash
pnpm dev            # http://localhost:5173 ; /api se reenvia a http://localhost:8000
pnpm typecheck      # react-router typegen && tsc
pnpm lint
pnpm test
pnpm build
```
