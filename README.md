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
| **Neon (Postgres serverless)** | **Usuarios** (uno por wallet, con sus stats) y ranking global persistente vía funciones serverless. | [`api/`](api) · [`db/schema.sql`](db/schema.sql) |

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
  inyectado (`window.solana`, etc.) y con el RPC por `fetch`. Al **conectar** la
  wallet se crea (o refresca) su **usuario** en Neon; al terminar la partida, la
  puntuación se **firma** con la wallet antes de enviarse.
- **Usuarios.** Cada wallet que se conecta se registra como usuario (`POST
  /api/users`), identificado por su dirección. La tabla `users` guarda su nombre y
  sus estadísticas agregadas (`best_score`, `games_played`), que se actualizan en
  cada envío de puntuación. La UI muestra el perfil del jugador y resalta su fila
  en el ranking.
- **Neon.** El mismo *handler* ([`api/leaderboard-core.js`](api/leaderboard-core.js))
  se sirve como funciones serverless de Vercel (`/api/leaderboard`, `/api/users`) y
  como *middleware* del dev server de Vite. Si `DATABASE_URL` está definido,
  persiste en Neon (tablas `users` y `scores`); si no, usa un almacén en memoria. El
  cliente además cae a `localStorage` si la API no está disponible (p. ej. hosting
  estático).

## Desarrollo local

Requiere un navegador con **WebGPU** (Chrome/Edge 113+, o Firefox reciente) con
aceleración por hardware.

```bash
npm install
npm run dev      # http://localhost:5173  (incluye /api/leaderboard y /api/users)
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

### Archivo único (abrir con doble clic)

```bash
npm run build:single   # genera dist-single/index.html autocontenido
```

Todo (JS y CSS) queda embebido en un único `index.html` que se abre con doble
clic en Chrome/Edge (113+) con WebGPU. `file://` es contexto seguro, así que
WebGPU funciona sin servidor; el ranking cae a `localStorage` en este modo.

## Despliegue en Vercel (recomendado)

El repo está listo para Vercel *sin configuración extra* ([`vercel.json`](vercel.json)
fija el preset de Vite; la función [`api/leaderboard.js`](api/leaderboard.js) se
detecta sola en `/api/leaderboard`).

**Un clic:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cacereslucianoljc5-cmyk/Clash3deee/tree/claude/vite-typegpu-solana-game-xfkuhh&env=DATABASE_URL&envDescription=Cadena%20de%20conexi%C3%B3n%20de%20Neon%20para%20el%20ranking%20(opcional))

**Manual:**

1. En [vercel.com/new](https://vercel.com/new) importa `cacereslucianoljc5-cmyk/Clash3deee`
   y elige la rama `claude/vite-typegpu-solana-game-xfkuhh`.
2. Framework: **Vite** (autodetectado). Build `npm run build`, output `dist`.
3. (Opcional) Añade la variable `DATABASE_URL` con tu cadena de Neon para el
   ranking global. Sin ella, el ranking usa `localStorage`.
4. **Deploy**. Obtendrás una URL `https://<tu-proyecto>.vercel.app`.

**CLI (desde tu máquina):**

```bash
npm i -g vercel
vercel            # despliegue de preview
vercel --prod     # despliegue de producción
```

### Otras opciones

- **Solo estático (GitHub Pages / cualquier CDN).** `npm run build` genera `dist/`.
  El juego funciona completo; el ranking cae a `localStorage`. Si quieres ranking
  **global** desde un sitio estático, despliega la API en Vercel (con `DATABASE_URL`)
  y apunta el cliente con `VITE_API_URL=https://tu-app.vercel.app/api/leaderboard` y
  `VITE_USERS_API_URL=https://tu-app.vercel.app/api/users`. La API ya envía cabeceras
  **CORS** (`Access-Control-Allow-Origin`, configurable con `CORS_ORIGIN`), así que el
  fetch cross-origin desde tu dominio estático funciona.

## Variables de entorno

| Variable | Descripción | Por defecto |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión de Neon (lado servidor). | — (memoria) |
| `VITE_SOLANA_RPC` | Endpoint RPC de Solana. | `https://api.devnet.solana.com` |
| `VITE_SOLANA_CLUSTER` | Cluster mostrado en la UI. | `devnet` |
| `VITE_API_URL` | URL de la API de ranking. | `/api/leaderboard` |
| `VITE_USERS_API_URL` | URL de la API de usuarios. | `/api/users` |
| `CORS_ORIGIN` | Origen permitido por la API (lado servidor). Útil si sirves el frontend estático desde otro dominio. | `*` |

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
