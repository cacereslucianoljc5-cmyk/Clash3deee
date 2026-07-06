---
name: meshy-3d
description: Genera modelos 3D a partir de texto con Meshy AI (text-to-3D). Úsala cuando el usuario quiera crear/generar un modelo, asset, malla o archivo 3D (GLB/FBX/OBJ) desde una descripción textual — por ejemplo props, personajes o objetos para un juego. Requiere la variable de entorno MESHY_API_KEY.
---

# Meshy 3D — generación text-to-3D

Genera modelos 3D con [Meshy AI](https://www.meshy.ai/) usando un CLI sin
dependencias (`meshy.mjs`). La API key se lee de `MESHY_API_KEY` en el entorno;
nunca la escribas en archivos ni en el repo.

## Requisitos previos

1. Node >= 18.
2. `MESHY_API_KEY` exportada en el entorno:
   ```bash
   export MESHY_API_KEY=msy_...
   ```
   Si no está definida, el CLI falla con un mensaje claro. Pídele la key al
   usuario o dile que la exporte; **no** la hardcodees.

## Uso

Todos los comandos se ejecutan desde la carpeta de la skill:

```bash
# Créditos disponibles (buena forma de verificar que la key funciona)
node meshy.mjs balance

# Generar un modelo (preview: geometría sin texturas) y descargarlo
node meshy.mjs generate "un caballero medieval con armadura de asedio" \
  --art-style realistic --out ./modelos

# Modelo texturizado completo (preview + refine); tarda más y gasta más créditos
node meshy.mjs generate "torre de asedio de madera" --refine --out ./modelos

# Consultar el estado/resultado de una tarea por id
node meshy.mjs status <taskId>
```

### Opciones de `generate`

| Flag | Descripción |
|---|---|
| `--art-style <realistic\|sculpture>` | Estilo (por defecto `realistic`). |
| `--negative "<texto>"` | Prompt negativo (qué evitar). |
| `--refine` | Tras el preview, genera el modelo texturizado final. |
| `--out <dir>` | Descarga `.glb` y thumbnail `.png` a ese directorio. |
| `--json` | Fuerza imprimir el JSON completo de la tarea en stdout. |

El progreso va a **stderr** y el resultado (rutas de archivos o JSON) a
**stdout**, para poder encadenarlo.

## Cómo actuar (para Claude)

1. Si el usuario pide un modelo 3D, confirma el prompt y ejecuta `generate`.
   Usa `--out` en un directorio del proyecto (p. ej. `./modelos`) salvo que el
   usuario indique otro.
2. Ofrece `--refine` cuando quiera un modelo final texturizado; explica que
   consume más créditos y tarda unos minutos.
3. Si un comando falla por `MESHY_API_KEY` ausente, dile al usuario que la
   exporte; no inventes ni pegues la key.
4. Tras generar, informa la ruta del `.glb` y el `id` de la tarea.

## Notas

- Los `model_urls` de Meshy (GLB/FBX/OBJ/USDZ) caducan; descarga con `--out`
  si quieres conservar los archivos.
- Entornos con proxy: el `fetch` de Node no lee `HTTPS_PROXY` por defecto.
  Si estás detrás de un proxy corporativo, ejecuta con
  `NODE_USE_ENV_PROXY=1` (Node >= 22.21). En una máquina normal no hace falta.
- Si compartiste tu key en texto plano, rótala en el panel de Meshy.
