# Neon MCP Server

El **Model Context Protocol server** de Neon deja que un agente/IDE (Claude,
Cursor, VS Code, etc.) gestione Neon **en lenguaje natural**: crear proyectos y
ramas, inspeccionar esquema, correr SQL y migraciones, gestionar Auth y Data API.

> ⚠️ Concede capacidades amplias de gestión de la base. Usalo con una API key de
> alcance acotado y revisá lo que el agente ejecuta, sobre todo en producción.

## Herramientas que expone (categorías)
- **Projects** — listar/crear/gestionar proyectos.
- **Branches** — crear/borrar/reset ramas.
- **Schema** — tablas, columnas, índices.
- **Querying** — ejecutar SQL y ver planes (`EXPLAIN`).
- **Migrations** — aplicar cambios de esquema (a menudo vía rama temporal).
- **Neon Auth** — usuarios y sesiones.
- **Data API** — endpoints REST.
- **Docs** — buscar en la documentación.

## Opción A — Servidor remoto (gestionado por Neon)
Apuntá tu cliente MCP al endpoint remoto de Neon y autorizá por OAuth
(`https://mcp.neon.tech/...`). No requiere instalar nada localmente.

## Opción B — Local vía npx
```bash
npx -y @neondatabase/mcp-server-neon start $NEON_API_KEY
```

## Configurar en un cliente MCP (ejemplo genérico)
```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon", "start", "${NEON_API_KEY}"]
    }
  }
}
```
Para Claude Code: agregarlo a la config de MCP servers (o `claude mcp add`). Para
el servidor remoto, usar la URL con OAuth en vez de `command`. Plantilla en
`templates/mcp-config.json`.

## Buenas prácticas
- API key dedicada para el MCP; revocable y con el menor alcance posible.
- Preferí que el agente trabaje sobre **ramas** y no sobre `production`.
- Revisá los `EXPLAIN`/migraciones que proponga antes de aplicarlos a prod.
