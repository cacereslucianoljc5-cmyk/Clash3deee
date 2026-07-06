# Patrones por arquitectura

Cómo conectar a Neon según el tipo de proyecto. La constante: **el acceso a la
base ocurre en el servidor**.

## Next.js (App Router)
- **Dónde:** Route Handlers (`app/api/*/route.ts`) o Server Actions.
- **Plantilla:** `templates/nextjs-route.ts`.
- **Notas:** el código de servidor no se envía al cliente. No prefijar la env
  var con `NEXT_PUBLIC_`. Ideal para el driver de Neon.

## Vite / CRA / SvelteKit estático desplegado en Vercel
- **Dónde:** funciones serverless en `api/` (Vercel las detecta solas).
- **Plantilla:** `templates/vercel-node-handler.js`.
- **Frontend:** `fetch('/api/...')` al mismo origen.
- **Local:** `vercel dev` sirve frontend + `api/` juntos (`npm run dev` de Vite
  NO levanta `api/`).

## Estático en Netlify
- **Dónde:** `netlify/functions/`.
- **Plantilla:** `templates/netlify-handler.js`.
- **Frontend:** `fetch('/.netlify/functions/<nombre>')`.
- **Local:** `netlify dev`.

## Node / Express / Fastify (servidor propio)
- **Dónde:** un módulo cliente compartido + rutas.
- **Plantilla:** `templates/node-client.js`.
- **Notas:** con un proceso de larga vida, crear el cliente una vez y
  reutilizarlo. Usar `dotenv` para cargar `.env.local` en desarrollo.

## Cloudflare Pages / Workers
- **Dónde:** un Worker o Pages Function.
- **Plantilla:** `templates/cloudflare-worker.js`.
- **Notas:** leer la conexión de `env.DATABASE_URL` (no `process.env`).
  Secreto con `wrangler secret put DATABASE_URL`.

## Sitio 100% estático SIN backend (GitHub Pages, S3, etc.)
- **Problema:** no hay servidor donde esconder la conexión. Conectar desde el
  navegador expondría usuario y contraseña a cualquiera.
- **Opciones:**
  1. Añadir una capa serverless aparte (Cloudflare Worker, función de Vercel/
     Netlify) y llamarla por `fetch` desde el sitio estático.
  2. Mover el hosting a una plataforma con funciones (Vercel/Netlify).
  3. Si de verdad se necesita acceso desde el cliente, usar el **Data API /
     PostgREST de Neon** con Row Level Security y una API key acotada — pero
     esto es avanzado y hay que diseñar las políticas RLS con cuidado.
- **Recomendación por defecto:** opción 1 o 2. Preguntar al usuario dónde quiere
  alojar la capa de servidor antes de escribir código.

## Elegir driver: `neon()` vs `Pool`
- `neon(url)` — consultas HTTP one-shot. Perfecto para serverless/edge y la
  mayoría de casos (una consulta por request).
- `Pool`/`Client` (de `@neondatabase/serverless`) — cuando se necesitan sesiones
  con estado, transacciones interactivas largas o `LISTEN/NOTIFY`. Usa
  WebSockets. Para servidores Node de larga vida.
