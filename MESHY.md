# Integración con Meshy AI (Text-to-3D)

Genera modelos 3D a partir de texto con [Meshy AI](https://www.meshy.ai/) desde
la web, **sin exponer la API key**.

## Por qué hay un proxy

Este sitio es estático y se publica en GitHub Pages (público). Si la API key de
Meshy se pusiera en el código de React, se compilaría dentro del bundle y
**cualquiera podría leerla y gastar tus créditos**.

Por eso la key vive en un **Cloudflare Worker** (proxy serverless) que la guarda
como *secret*. El navegador llama al Worker; el Worker llama a Meshy.

```
Navegador  ──►  Cloudflare Worker (guarda MESHY_API_KEY)  ──►  api.meshy.ai
```

## 1. Desplegar el proxy

```bash
cd worker
npm i -g wrangler            # o usa: npx wrangler ...

# Guarda tu key de Meshy como secret (te la pedirá interactivamente):
npx wrangler secret put MESHY_API_KEY
#   pega aquí:  msy_...

# (opcional) restringe CORS a tu dominio en worker/wrangler.toml -> ALLOWED_ORIGIN
npx wrangler deploy
```

Wrangler devolverá una URL como:

```
https://meshy-proxy.tu-subdominio.workers.dev
```

## 2. Configurar el frontend

```bash
cp .env.example .env.local
# edita .env.local:
# VITE_MESHY_PROXY_URL=https://meshy-proxy.tu-subdominio.workers.dev
```

En el deploy de GitHub Pages, define `VITE_MESHY_PROXY_URL` como variable del
workflow (o secret de repo) antes de `npm run build`, por ejemplo:

```yaml
      - run: npm run build
        env:
          VITE_MESHY_PROXY_URL: ${{ secrets.MESHY_PROXY_URL }}
```

## 3. Usar

- Local: `npm run dev` y abre `http://localhost:5173/#meshy`
- Producción: `https://cacereslucianoljc5-cmyk.github.io/clash3deee/#meshy`

Escribe una descripción, elige estilo y pulsa **Generar**. Se muestra una barra
de progreso y, al terminar, un visor 3D interactivo (`<model-viewer>`) con
enlaces de descarga (GLB, FBX, OBJ, USDZ).

## Archivos

| Archivo | Rol |
|---|---|
| `worker/meshy-proxy.js` | Proxy serverless que guarda la key y habla con Meshy. |
| `worker/wrangler.toml` | Config de despliegue del Worker. |
| `src/lib/meshy.js` | Cliente frontend (solo habla con el proxy). |
| `src/MeshyGenerator.jsx` | UI de generación + visor 3D. |
| `src/main.jsx` | Ruta `#meshy` que monta el generador. |

## Seguridad

- La key **nunca** se sube al repo ni al bundle. `.env*` está en `.gitignore`.
- Si compartiste la key en texto plano, **rótala** en el panel de Meshy.
- En producción, fija `ALLOWED_ORIGIN` en `wrangler.toml` a tu dominio.

## Nota sobre créditos

`text-to-3d` en modo `preview` genera geometría sin texturas. Para el modelo
texturizado final se lanza una segunda tarea en modo `refine` con el
`preview_task_id`. El cliente (`src/lib/meshy.js`) ya soporta ambos modos.
