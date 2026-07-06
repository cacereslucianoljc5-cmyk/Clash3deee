# ⚔ Siege Kingdoms — $SIEGE

Landing page de la memecoin **Siege Kingdoms**, construida con **React + Vite**.

La interfaz vive en un único componente: [`src/App.jsx`](src/App.jsx). Usa
utilidades de Tailwind (vía Play CDN) para el layout, fuentes de Google
(Baloo 2 / Manrope / Space Mono) y varios efectos de animación
(BlurText, ScrollReveal, Marquee, CountUp, tarjetas con tilt, etc.).

## Desarrollo local

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # genera la versión de producción en dist/
npm run preview  # sirve la build localmente
```

## Despliegue

Cada push a la rama `claude/web-page-github-376yuj` dispara el workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que compila el
sitio y lo publica en **GitHub Pages**:

<https://cacereslucianoljc5-cmyk.github.io/clash3deee/>

> Nota: `vite.config.js` fija `base: '/clash3deee/'` para que las rutas de los
> assets funcionen bajo el subdirectorio del repositorio en GitHub Pages.

## Whitelist de correos con Neon (Postgres) + Vercel

La sección final incluye un formulario de whitelist. Los correos se guardan en
una base **Neon** (Postgres serverless) a través de una **función serverless de
Vercel** — [`api/whitelist.js`](api/whitelist.js). El navegador nunca ve la
cadena de conexión: solo llama a `POST /api/whitelist`.

> ⚠️ **GitHub Pages no ejecuta código de servidor**, así que la whitelist solo
> funciona en el despliegue de **Vercel**. En GitHub Pages el formulario se
> muestra pero la llamada a `/api/whitelist` no responde.

### Puesta en marcha

1. **Crear la base en Neon** (<https://console.neon.tech>): creá un proyecto y,
   en el **SQL Editor**, ejecutá el contenido de [`schema.sql`](schema.sql) para
   crear la tabla `whitelist`.
2. **Copiar la cadena de conexión**: en Neon → *Connect* → *Connection string*,
   usá la variante **Pooled connection** (el host incluye `-pooler`).
3. **Desplegar en Vercel**: importá este repositorio en <https://vercel.com>.
   Vercel detecta Vite automáticamente (build `vite build`, salida `dist`) y
   publica `api/` como funciones serverless.
4. **Configurar la variable de entorno** en Vercel → *Settings* → *Environment
   Variables*:

   | Nombre         | Valor                                   |
   | -------------- | --------------------------------------- |
   | `DATABASE_URL` | la cadena de conexión *pooled* de Neon  |

   Volvé a desplegar para que tome la variable.

### Desarrollo local con la API

`npm run dev` (Vite) **no** sirve las funciones de `api/`. Para probar la
whitelist localmente, copiá `.env.example` a `.env.local`, completá
`DATABASE_URL` y usá el CLI de Vercel:

```bash
npm i -g vercel
vercel dev   # sirve el frontend + /api en el mismo origen
```

> 🔒 **Nunca** commitees `DATABASE_URL` ni ninguna API key. `.env.local` está en
> `.gitignore`. La *API key de cuenta* de Neon (`napi_...`) **no** la usa la app:
> solo sirve para gestión y conviene rotarla si se expuso.

---

*$SIEGE es un token comunitario de utilidad, sin garantía de valor ni de
retorno. Nada en esta página es asesoría financiera.*
