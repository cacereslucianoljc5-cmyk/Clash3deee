# Instalar la skill `neon-db`

Esta skill vive en este repo (`.claude/skills/neon-db/`), así que ya está activa
**dentro de este proyecto**. Para usarla en **todos tus proyectos**, copiala a tu
carpeta global de skills de Claude Code.

## Opción A — Global (todos tus proyectos)

Copiá la carpeta a `~/.claude/skills/`:

```bash
# desde la raíz de este repo, en tu máquina local
mkdir -p ~/.claude/skills
cp -r .claude/skills/neon-db ~/.claude/skills/neon-db
```

Desde ese momento, en cualquier proyecto podés invocarla escribiendo
`/neon-db` (o Claude la usará sola cuando pidas "agregá una base de datos",
"conectá Neon", "guardá estos datos", etc.).

## Opción B — Por proyecto

Copiá `.claude/skills/neon-db/` dentro del proyecto donde la quieras y
commiteala con ese repo. Útil si querés versionarla junto al código.

## Qué cubre

Todas las funciones de Neon, cada una con su referencia en `references/`:
conexión (driver, Pool, transacciones), **branching** (ramas por PR, restore,
time-travel), **API de gestión** REST, **CLI** `neonctl`, **Data API** + RLS,
**Neon Auth**, **vector/IA** (`pgvector`), **extensiones**, autoscaling /
scale-to-zero / read replicas / pooling / PITR / CDC, **migraciones** (Drizzle/
Prisma) y el **MCP server**. Ver la tabla de capacidades en `SKILL.md`.

## Cómo se usa

1. Pedile a Claude algo como *"conectá este proyecto a Neon y guardá X"*, o algo
   más específico: *"creá una rama por PR"*, *"agregá búsqueda vectorial"*,
   *"exponé estas tablas con la Data API"*, *"configurá el MCP de Neon"*.
2. La skill detecta la arquitectura (Next.js, Vite+Vercel, Node, Cloudflare…) y
   aplica el patrón seguro correspondiente.
3. Vos creás el proyecto en Neon, ejecutás el `schema.sql` y pegás la
   `DATABASE_URL` en las variables de entorno de tu hosting (o lo automatizás con
   el CLI / la API / el MCP).

Ver `SKILL.md` para el detalle del flujo.
