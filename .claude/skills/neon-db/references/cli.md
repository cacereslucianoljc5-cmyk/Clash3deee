# CLI de Neon (`neonctl` / `neon`)

Maneja Postgres, ramas, Data API, Auth y Functions desde la terminal. Envuelve
la misma API de gestión con flujos por rama.

## Instalar y autenticar
```bash
npm install -g neonctl        # o: npx neonctl <cmd>
neonctl auth                  # login por navegador (OAuth)
# No interactivo (CI): exportar la API key
export NEON_API_KEY=napi_xxx
```
Casi todo acepta `--output json` (machine-readable) y `--project-id`.

## Grupos de comandos

### auth / me / projects
```bash
neonctl auth
neonctl me
neonctl projects list
neonctl projects create --name mi-app --region-id aws-us-east-1
neonctl projects get <id>
neonctl projects update <id> --name nuevo
neonctl projects delete <id>
```

### branches (lo más usado)
```bash
neonctl branches list
neonctl branches create --name pr-123 [--parent main]
neonctl branches get pr-123
neonctl branches rename pr-123 pr-123-fix
neonctl branches set-default pr-123
neonctl branches add-compute pr-123 --type read_only   # read replica
neonctl branches restore main main@2025-01-01T00:00:00Z # PITR
neonctl branches reset pr-123 --parent                  # re-sincronizar con el padre
neonctl branches schema-diff main pr-123
neonctl branches delete pr-123
```

### connection-string (alias `cs`)
```bash
neonctl connection-string [branch] [--database-name neondb] [--role-name neondb_owner] [--pooled]
neonctl cs pr-123 --pooled       # cadena "pooled" para serverless
```

### databases / roles
```bash
neonctl databases list --branch main
neonctl databases create --name app --branch main
neonctl databases delete app --branch main

neonctl roles list --branch main
neonctl roles create --name app_user --branch main
neonctl roles delete app_user --branch main
```

### operations / ip-allow / vpc / set-context
```bash
neonctl operations list --project-id <id>
neonctl ip-allow list                       # allowlist de IPs (planes con la feature)
neonctl set-context --project-id <id>       # fija proyecto por defecto (guarda contexto)
```

### Otros (según versión)
- `neonctl create-app` — scaffold de app conectada a Neon.
- Subcomandos para **Data API**, **Auth** y **Functions** (habilitar/gestionar).
  Verificá con `neonctl <grupo> --help`.
- `neonctl completion` — autocompletado del shell.

## Patrones útiles
```bash
# Cadena de conexión de una rama, lista para exportar en CI
export DATABASE_URL=$(neonctl cs pr-$PR --pooled --output json | jq -r '.uri // .connection_string')

# Crear rama efímera, migrar, y limpiar
neonctl branches create --name pr-$PR
DATABASE_URL=$(neonctl cs pr-$PR --pooled) npm run migrate
# ... al cerrar el PR:
neonctl branches delete pr-$PR
```

> Nota: los nombres exactos de flags cambian entre versiones. Ante la duda,
> `neonctl <comando> --help`. Todo esto también se puede hacer por API
> (`references/management-api.md`) o por MCP (`references/mcp.md`).
