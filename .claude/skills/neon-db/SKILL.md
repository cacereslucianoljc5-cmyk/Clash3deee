---
name: neon-db
description: Trabaja con Neon (Postgres serverless) de punta a punta en cualquier proyecto. Úsala cuando el usuario quiera agregar/usar una base de datos, guardar o leer datos, o mencione Neon, Postgres, "base de datos", "DB", branching, vector/embeddings, autenticación de usuarios, migraciones, o el MCP/CLI/API de Neon. Cubre TODAS las funciones de Neon — driver de conexión, branching, API de gestión, CLI (neonctl), Data API + RLS, Neon Auth, vector/IA (pgvector), extensiones, autoscaling/read replicas/time-travel, migraciones y el MCP server — y aplica cada patrón de forma segura sin exponer credenciales en el navegador.
---

# Neon — guía completa (Postgres serverless)

Neon es Postgres serverless con **branching instantáneo** (copy-on-write),
**autoescalado**, **scale-to-zero** y una **API/CLI/MCP** completa para
automatizarlo todo. Esta skill cubre todas sus funciones. Empezá por acá y abrí
la referencia que corresponda según lo que pida la tarea.

## Reglas de oro (NO negociables)

1. **La cadena de conexión (`DATABASE_URL`) NUNCA va al navegador.** Todo acceso
   a la base ocurre en el servidor. Si el proyecto es 100% frontend, hace falta
   una capa serverless. (Excepción controlada: la **Data API** con RLS — ver
   `references/data-api.md`.)
2. **Nunca commitear secretos.** `DATABASE_URL` y las API keys van en variables
   de entorno. `.gitignore` debe ignorar `.env*` salvo `.env.example`.
3. **Dos tipos de credencial, no confundir:**
   - **Cadena de conexión** (`postgresql://…`) → la usa la *app* para consultar.
   - **API key de cuenta/organización** (`napi_…`) → la usan *CLI/API/MCP* para
     gestionar proyectos y ramas. Nunca en el bundle del cliente. Si se expone,
     rotarla.
4. **Conexión "pooled"** (`-pooler` en el host) en entornos serverless.
5. **Parametrizar siempre** las consultas (`sql\`… ${x} …\``). Nunca concatenar
   entrada del usuario.

## Mapa de capacidades → dónde mirar

| Querés…                                                        | Referencia |
| -------------------------------------------------------------- | ---------- |
| Conectar y consultar desde la app (driver, Pool, transacciones)| `references/driver.md` |
| Elegir el patrón según el hosting (Next, Vite, Node, CF…)      | `references/patterns.md` |
| Ramas por PR, restore, time-travel, reset desde el padre        | `references/branching.md` |
| Automatizar Neon vía REST (crear proyectos/ramas/roles…)        | `references/management-api.md` |
| Hacer todo desde la terminal (`neonctl`)                        | `references/cli.md` |
| Exponer tablas como REST seguro con RLS (sin backend propio)    | `references/data-api.md` |
| Autenticación de usuarios lista para usar                       | `references/auth.md` |
| Búsqueda vectorial / embeddings / IA (`pgvector`)               | `references/ai-vector.md` |
| Extensiones de Postgres disponibles                             | `references/extensions.md` |
| Autoscaling, scale-to-zero, read replicas, pooling, PITR, CDC   | `references/compute-features.md` |
| Migraciones de esquema (Drizzle / Prisma) con branching en CI   | `references/migrations.md` |
| Que un agente/IDE gestione Neon con lenguaje natural (MCP)      | `references/mcp.md` |
| Integrar con Vercel / Netlify / GitHub Actions                  | `references/integrations.md` |
| Checklist de seguridad antes de terminar                        | `references/security.md` |

## Flujo típico para "agregá/usá una base"

1. **Detectar arquitectura** del proyecto (`package.json`, config, hosting) y
   elegir patrón → `references/patterns.md`.
2. **Instalar el driver:** `npm install @neondatabase/serverless`.
3. **Esquema:** crear `schema.sql` (partir de `templates/schema.sql`) y decirle
   al usuario que lo ejecute en Neon Console → SQL Editor (o vía CLI/MCP).
4. **Capa de datos:** copiar la plantilla del hosting correspondiente
   (`templates/*`) y adaptarla; leer siempre `process.env.DATABASE_URL`.
5. **Entorno:** `templates/env.example` → `.env.example`; asegurar `.gitignore`.
6. **Pasos manuales del usuario:** crear proyecto en Neon, correr el esquema,
   poner `DATABASE_URL` en el hosting y redeployar. (O automatizarlo con
   `references/cli.md` / `references/management-api.md` / MCP.)
7. **Verificar:** que el build pase y, si hay CLI del hosting, probar el
   endpoint local (`vercel dev`, `netlify dev`).

## Snippet base del driver
```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`SELECT id, email FROM users WHERE active = ${true}`;
```
Más formas (Pool, Client, transacciones, config) en `references/driver.md`.

## Cuándo preguntar
Si el hosting o el objetivo no están claros (sobre todo en sitios estáticos sin
backend, o al elegir entre app-tradicional vs Data API), **preguntar antes de
escribir código**. El resto se decide con la tabla de arriba.
