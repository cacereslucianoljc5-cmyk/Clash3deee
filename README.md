# Clash3deee

Modelos 3D (formato glTF binario `.glb`) para el proyecto Clash, más un
visor/arena interactivo en 3D hecho con [three.js](https://threejs.org).

## Visor 3D (`index.html`)

Una escena con la arena y las torres ya colocadas. Elige una carta del deck
inferior y haz clic sobre la arena para desplegar la unidad.

Como usa módulos ES y carga archivos `.glb`, hay que servirlo por HTTP
(no abrir el `index.html` con `file://`):

```bash
# desde la raíz del repo
python3 -m http.server 8000
# luego abre http://localhost:8000
```

O actívalo en **GitHub Pages** (Settings → Pages → rama del repo) y se sirve solo.


## Modelos

| Archivo | Unidad |
|---------|--------|
| `models/Arquero.glb` | Arquero |
| `models/Barbaro.glb` | Bárbaro |
| `models/Bombardero.glb` | Bombardero |
| `models/Canon.glb` | Cañón |
| `models/Esqueleto.glb` | Esqueleto |
| `models/Gigante.glb` | Gigante |
| `models/MagoFuego.glb` | Mago de Fuego |
| `models/MontaPuercos.glb` | Montapuercos |
| `models/Pekka.glb` | P.E.K.K.A |
| `models/Torre.glb` | Torre |
| `models/TorreRey.glb` | Torre del Rey |
| `models/Arena.glb` | Arena |
