import { defineConfig } from 'drizzle-kit';

// Config de Drizzle Kit para Neon.
// Requiere DATABASE_URL en el entorno (usá dotenv en local).
// Comandos:
//   npx drizzle-kit generate   -> genera SQL desde ./src/schema.ts
//   npx drizzle-kit migrate    -> aplica las migraciones
//   npx drizzle-kit push       -> (dev) sincroniza sin archivos de migración

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

/* --- Cliente (src/db.ts) ---
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
--------------------------------- */
