---
name: neon-db
description: Integra una base de datos Neon (Postgres serverless) en cualquier proyecto de forma segura. Úsala cuando el usuario quiera agregar una base de datos, guardar/leer datos, persistir formularios, whitelists, usuarios, contadores o cualquier dato, y mencione Neon, Postgres, "base de datos", "DB", o pida "conectar a una base". Detecta la arquitectura del proyecto (sitio estático, Vite, Next.js, Node/Express, Cloudflare, etc.) y aplica el patrón de conexión correcto sin exponer credenciales en el navegador.
---

# Integración de Neon (Postgres serverless)

Esta skill agrega una base de datos **Neon** a un proyecto y lo hace de forma
**segura por defecto**. Neon es Postgres serverless; se conecta con el driver
`@neondatabase/serverless` (funciona sobre HTTP/WebSocket, ideal para funciones
serverless y edge).

## Reglas de oro (NO negociables)

1. **La cadena de conexión (`DATABASE_URL`) NUNCA va al navegador.** Contiene
   usuario y contraseña. Todo acceso a la base ocurre en el servidor (función
   serverless, ruta de API, backend). Si el proyecto es 100% frontend, hay que
   introducir una capa de servidor.
2. **Nunca commitear secretos.** `DATABASE_URL` va en variables de entorno
   (`.env.local` en local, panel del hosting en producción). Asegurar que
   `.gitignore` ignore `.env*` (excepto `.env.example`).
3. **No confundir claves.** La *API key de cuenta* de Neon (`napi_...`) sirve
   para gestión (crear/borrar proyectos) y **no** la usa la app. La app solo
   necesita la **cadena de conexión** de la base. Si el usuario pega una
   `napi_...` en texto plano, advertir que la rote.
4. **Usar la conexión "pooled".** En Neon → *Connect*, elegir la que incluye
   `-pooler` en el host. Es la adecuada para entornos serverless.
5. **Parametrizar siempre las consultas** (plantillas `sql\`...\`` con `${...}`).
   Nunca concatenar entrada del usuario en el SQL.

## Flujo de trabajo

### 1. Detectar la arquitectura del proyecto
Mirar `package.json`, archivos de config y estructura para clasificar:

- **Next.js** (`next` en deps) → usar Route Handlers / Server Actions. El
  cliente de DB vive en el servidor por defecto.
- **Vite/CRA/estático desplegado en Vercel** → funciones serverless en `api/`.
- **Estático en Netlify** → `netlify/functions/`.
- **Node/Express/Fastify** → módulo cliente + rutas de servidor.
- **Cloudflare Pages/Workers** → Worker con el driver (usar `fetch`).
- **Sitio estático puro (GitHub Pages, S3) sin backend** → *no se puede
  conectar de forma segura*. Explicarlo y proponer añadir una capa serverless
  (Vercel/Netlify/Cloudflare) o mover el hosting. Ver `references/patterns.md`.

Si hay dudas sobre el hosting o el objetivo, **preguntar** antes de escribir código.

### 2. Instalar el driver
```bash
npm install @neondatabase/serverless
```

### 3. Definir el esquema
Crear un `schema.sql` con las tablas que pida la tarea (partir de
`templates/schema.sql`). Indicar al usuario que lo ejecute una vez en
**Neon Console → SQL Editor**.

### 4. Escribir la capa de acceso a datos
Copiar y adaptar la plantilla que corresponda a la arquitectura detectada:

- `templates/vercel-node-handler.js` — función serverless de Vercel (`api/`).
- `templates/netlify-handler.js` — Netlify Function.
- `templates/cloudflare-worker.js` — Cloudflare Worker/Pages Function.
- `templates/node-client.js` — cliente reutilizable para Node/Express.
- `templates/nextjs-route.ts` — Route Handler de Next.js (App Router).

Todas leen la conexión de `process.env.DATABASE_URL` (o `env.DATABASE_URL` en
Workers) y validan la entrada.

### 5. Configurar entorno y `.gitignore`
- Copiar `templates/env.example` a `.env.example` en el proyecto.
- Asegurar en `.gitignore`: `.env`, `.env.*`, `!.env.example`.
- Crear `.env.local` con la `DATABASE_URL` real (sin commitear) para pruebas.

### 6. Explicar los pasos manuales al usuario
El asistente normalmente **no puede** crear el proyecto Neon ni configurar los
secretos del hosting. Entregar una lista breve:
1. Crear proyecto en <https://console.neon.tech> y ejecutar `schema.sql`.
2. Copiar la cadena **pooled** de conexión.
3. Poner `DATABASE_URL` en las env vars del hosting y redeployar.

### 7. Verificar
- `npm run build` (o el build del proyecto) debe pasar.
- Si hay CLI del hosting (`vercel dev`, `netlify dev`), sugerir probar el
  endpoint localmente con `.env.local`.

## Consultas típicas con el driver
```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// SELECT (devuelve array de filas)
const users = await sql`SELECT id, email FROM users WHERE active = ${true}`;

// INSERT con upsert idempotente
const rows = await sql`
  INSERT INTO whitelist (email) VALUES (${email})
  ON CONFLICT (email) DO NOTHING
  RETURNING id`;

// Transacción (varias sentencias atómicas)
await sql.transaction([
  sql`UPDATE accounts SET balance = balance - ${amt} WHERE id = ${from}`,
  sql`UPDATE accounts SET balance = balance + ${amt} WHERE id = ${to}`,
]);
```

## Referencias
- `references/security.md` — checklist de seguridad detallado.
- `references/patterns.md` — cada arquitectura con su patrón y por qué.
