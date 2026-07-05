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

---

*$SIEGE es un token comunitario de utilidad, sin garantía de valor ni de
retorno. Nada en esta página es asesoría financiera.*
