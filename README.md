# ⚔️ Siege Kingdoms — GPU Siege

Juego web **WebGPU** construido con **Vite + React**, en el que miles de invasores
se simulan **enteramente en la GPU con [TypeGPU](https://typegpu.com)** y avanzan
hacia tu castillo. Haces clic para lanzar ondas de choque y destruirlos antes de
que rompan la muralla.

Integra tres piezas:

| Pieza | Para qué | Dónde |
| --- | --- | --- |
| **TypeGPU / WebGPU** | Simulación de ~24 000 partículas (movimiento, colisiones, puntuación) en *compute shaders*, y render instanciado. | [`src/game/`](src/game) |
| **Solana** | Conectar wallet (Phantom/Solflare/Backpack), leer balance en devnet y **firmar** la puntuación. | [`src/solana/wallet.js`](src/solana/wallet.js) |
| **Neon (Postgres serverless)** | Ranking global persistente vía función serverless. | [`api/`](api) · [`db/schema.sql`](db/schema.sql) |

## Cómo funciona

- **GPU (TypeGPU).** `initFromDevice` monta un `TgpuRoot` sobre un `GPUDevice`
  propio (reteniendo el `GPUAdapter` para evitar pérdidas de device). Los buffers
  tipados (`d.struct`, `d.arrayOf`) describen partículas, parámetros y ondas de
  choque; un *compute shader* (`initMain`/`simMain`) mueve cada partícula, resuelve
  colisiones y acumula puntuación y brechas en un buffer atómico que se lee de
  vuelta a la CPU de forma asíncrona. Un *render pass* dibuja cada partícula como
  un *billboard* aditivo. Ver [`src/game/shaders.js`](src/game/shaders.js) y
  [`src/game/renderer.js`](src/game/renderer.js).
- **Solana.** Sin dependencias pesadas: se habla directamente con el proveedor
  inyectado (`window.solana`, etc.) y con el RPC por `fetch`. Al terminar la
  partida, la puntuación se **firma** con la wallet antes de enviarse.
- **Neon.** El mismo *handler* ([`api/leaderboard-core.js`](api/leaderboard-core.js))
  se sirve como función serverless de Vercel y como *middleware* del dev server de
  Vite. Si `DATABASE_URL` está definido, persiste en Neon; si no, usa un almacén en
  memoria. El cliente además cae a `localStorage` si la API no está disponible
  (p. ej. hosting estático).

## Desarrollo local

Requiere un navegador con **WebGPU** (Chrome/Edge 113+, o Firefox reciente) con
aceleración por hardware.

```bash
npm install
npm run dev      # http://localhost:5173  (incluye /api/leaderboard)
npm run build    # build de producción en dist/
npm run preview  # sirve la build localmente
```

### Ranking con Neon (opcional)

1. Crea una base de datos en [Neon](https://neon.tech) y copia la cadena de
   conexión.
2. Copia `.env.example` a `.env` y rellena `DATABASE_URL`.
3. `npm run dev` ya persistirá las puntuaciones en Neon (la tabla se crea sola;
   ver [`db/schema.sql`](db/schema.sql) como referencia).

Sin `DATABASE_URL`, el juego es igualmente jugable: el ranking usa un almacén en
memoria (dev) o `localStorage` (estático).

## Despliegue

- **Stack completo (con ranking en Neon): Vercel.** Importa el repo, define
  `DATABASE_URL` en las variables de entorno y la función [`api/leaderboard.js`](api/leaderboard.js)
  queda disponible en `/api/leaderboard`.
- **Solo estático (GitHub Pages / cualquier CDN).** `npm run build` genera `dist/`.
  El juego funciona completo; el ranking cae a `localStorage`. Si quieres ranking
  global desde un sitio estático, despliega la API en Vercel y apunta el cliente
  con `VITE_API_URL=https://tu-app.vercel.app/api/leaderboard`.

## Variables de entorno

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión de Neon (lado servidor). | — (memoria) |
| `VITE_SOLANA_RPC` | Endpoint RPC de Solana. | `https://api.devnet.solana.com` |
| `VITE_SOLANA_CLUSTER` | Cluster mostrado en la UI. | `devnet` |
| `VITE_API_URL` | URL de la API de ranking. | `/api/leaderboard` |

## Notas

- La simulación de partículas y toda la lógica de juego (movimiento, colisiones,
  puntuación, brechas) se ejecuta en la GPU y está verificada de extremo a extremo.
  El render a canvas requiere WebGPU real; algunos entornos *headless* por software
  no soportan la presentación a canvas.
- El landing anterior de la memecoin sigue en el repo como [`src/App.jsx`](src/App.jsx)
  (ya no se usa; el punto de entrada ahora es [`src/GameApp.jsx`](src/GameApp.jsx)).

---

*Demo educativa. La integración con Solana usa **devnet** y no mueve fondos
reales; nada de esto es asesoría financiera.*
