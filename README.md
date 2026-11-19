# Mibers Web

Frontend del aplicativo de gestión de contenido de Mibers Creativos. SPA con React Router v8 (modo framework,
`ssr: false`), TypeScript y Tailwind v4, sobre la API Django de `../mibers-api`.

## Desarrollo

```bash
pnpm install
cp .env.example .env        # opcional: API_PROXY_TARGET si la API no está en :8000
pnpm dev                    # http://localhost:5173 (/api se reenvía al backend)
pnpm check                  # typecheck + lint + pruebas
pnpm build                  # genera build/client (estático, desplegable en cualquier CDN)
```

Convenciones del equipo en [`AGENTS.md`](AGENTS.md); contrato de la API en [`docs/api-modulo-1.md`](docs/api-modulo-1.md).

## Git

Repositorio local. `core.hooksPath` apunta a `.githooks/`: el hook `commit-msg` elimina cualquier trailer
`Co-authored-by` y rechaza autores que sean agentes de IA. Tras clonar: `git config core.hooksPath .githooks`.
Commits: `tipo: descripción corta` (feat/fix/chore/docs/test), en español.
