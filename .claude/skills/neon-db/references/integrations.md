# Integraciones (Vercel, Netlify, GitHub Actions)

## Vercel
Dos caminos:

### a) Neon Postgres nativo en Vercel (Marketplace)
Desde el dashboard de Vercel → Storage/Integrations → agregás Neon. Vercel
inyecta automáticamente `DATABASE_URL` (y variantes) como env vars del proyecto.
No hace falta copiarlas a mano.

### b) Integración de branching por Preview
Conectás el repo y Neon crea una **rama por cada Preview Deployment**, así cada
PR tiene su base aislada. Al cerrar el PR se limpia la rama. Ideal con el patrón
de `references/branching.md`.

Runtime: en Vercel, `api/` (o Route Handlers de Next) leen `process.env.DATABASE_URL`.
Ver `templates/vercel-node-handler.js` y `templates/nextjs-route.ts`.

## Netlify
- Integración de Neon en Netlify que provee `DATABASE_URL` a las
  **Netlify Functions**.
- Endpoint en `netlify/functions/<nombre>` → `/.netlify/functions/<nombre>`.
- Ver `templates/netlify-handler.js`.

## GitHub Actions (branch por PR)
Neon publica actions oficiales para crear/borrar ramas por PR:
- `neondatabase/create-branch-action` — crea `pr-<n>` y expone su `DATABASE_URL`.
- `neondatabase/delete-branch-action` — la borra al cerrar el PR.

Ejemplo de workflow:
```yaml
name: preview-db
on:
  pull_request:
    types: [opened, reopened, synchronize, closed]
jobs:
  branch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - if: github.event.action != 'closed'
        id: create
        uses: neondatabase/create-branch-action@v5
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch_name: pr-${{ github.event.number }}
          api_key: ${{ secrets.NEON_API_KEY }}
      - if: github.event.action != 'closed'
        run: npm ci && npm run migrate
        env:
          DATABASE_URL: ${{ steps.create.outputs.db_url_pooled }}
      - if: github.event.action == 'closed'
        uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch: pr-${{ github.event.number }}
          api_key: ${{ secrets.NEON_API_KEY }}
```
Guardá `NEON_API_KEY` como **secret** y `NEON_PROJECT_ID` como **variable**.
Los nombres de outputs/inputs pueden variar entre versiones de la action —
confirmá en su README.

## Cloudflare
No hay integración nativa que inyecte env vars, pero funciona perfecto: guardá
la conexión con `wrangler secret put DATABASE_URL` y usá el driver desde el
Worker (`templates/cloudflare-worker.js`).

## Otras
- **Terraform**: provider oficial para gestionar proyectos/ramas como IaC.
- **ORMs/plataformas** (Drizzle, Prisma, Vercel, Deno Deploy, etc.) tratan a
  Neon como cualquier Postgres vía la cadena de conexión.
