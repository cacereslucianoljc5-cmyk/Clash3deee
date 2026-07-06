# Migraciones de esquema (Drizzle / Prisma) con branching

Gestioná cambios de esquema versionados y aprovechá el **branching** de Neon
para probar migraciones en una rama antes de tocar producción.

## Regla general
- Corré migraciones con la **cadena directa** (sin `-pooler`) o con la pooled
  según la herramienta; algunas fallan bajo transaction pooling. Ante errores de
  prepared statements, usá la cadena directa.
- En CI, migrá contra una **rama efímera** por PR (`references/branching.md`) y
  descartála al cerrar.

## Drizzle ORM
`npm install drizzle-orm @neondatabase/serverless && npm install -D drizzle-kit`

Cliente (HTTP, serverless):
```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```
O con Pool (sesión/transacciones interactivas):
```ts
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
export const db = drizzle(new Pool({ connectionString: process.env.DATABASE_URL! }));
```
Config (`drizzle.config.ts`) y flujo:
```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```
```bash
npx drizzle-kit generate   # genera SQL desde el schema TS
npx drizzle-kit migrate    # aplica migraciones
# (dev rápido) npx drizzle-kit push  # sincroniza sin archivos de migración
```
Ver `templates/drizzle-config.ts`.

## Prisma
Usá el **driver adapter** de Neon para que Prisma hable por el driver serverless:
`npm install @prisma/client @prisma/adapter-neon @neondatabase/serverless`
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client { provider = "prisma-client-js" }
```
```ts
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```
```bash
npx prisma migrate dev --name init     # desarrollo
npx prisma migrate deploy              # producción/CI
```
> Prisma con pooler: usá la cadena directa para `migrate`, y la pooled para la
> app en runtime. Podés setear ambas (`DATABASE_URL` / `DIRECT_URL`).

## SQL plano (sin ORM)
Mantené archivos `migrations/001_init.sql`, `002_...sql` y aplicalos con `psql`
o con la CLI de Neon apuntando a la rama:
```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
```

## Patrón CI con branching
1. Crear rama `pr-<n>`, obtener su `DATABASE_URL`.
2. `drizzle-kit migrate` / `prisma migrate deploy` sobre esa rama.
3. Correr tests contra la rama.
4. Al mergear, aplicar la migración a `main`. Al cerrar, borrar la rama.
Ver `templates/neon-branch-ci.sh`.
