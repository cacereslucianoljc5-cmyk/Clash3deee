# API de gestión de Neon (REST)

Automatiza TODO Neon por HTTP: proyectos, ramas, computes, bases, roles,
operaciones. Úsala en CI, Terraform, scripts o backends de plataforma.

- **Base URL:** `https://console.neon.tech/api/v2`
- **Auth:** header `Authorization: Bearer $NEON_API_KEY`
  (API key de cuenta u organización — `napi_…`). Generala en Console → Account
  settings → API keys. **Es secreta**: solo en el servidor/CI, nunca en el
  cliente.
- **Formato:** JSON. Muchas operaciones son **asíncronas** y devuelven objetos
  `operations` con un `id` y `status` — hay que pollear hasta `finished`.

> Referencia interactiva completa: <https://api-docs.neon.tech>.

## Recursos y endpoints principales

### API keys
- `GET /api_keys` · `POST /api_keys` · `DELETE /api_keys/{key_id}`

### Projects
- `GET /projects` — listar
- `POST /projects` — crear (devuelve la connection string inicial)
- `GET /projects/{project_id}` · `PATCH …` · `DELETE …`
- `GET /projects/{project_id}/connection_uri` — obtener cadena de conexión
- `GET /projects/{project_id}/operations` — operaciones del proyecto

### Branches
- `GET /projects/{project_id}/branches`
- `POST /projects/{project_id}/branches` — crear (opcionalmente con endpoints)
- `GET|PATCH|DELETE /projects/{project_id}/branches/{branch_id}`
- `POST …/branches/{branch_id}/set_as_default`
- `POST …/branches/{branch_id}/restore` — PITR / restore
- `GET …/branches/{branch_id}/schema_diff` — diff de esquema

### Endpoints (computes)
- `GET /projects/{project_id}/endpoints`
- `POST …/endpoints` — crear compute (read_write o read_only = read replica)
- `POST …/endpoints/{endpoint_id}/start` · `/suspend` · `/restart`
- `PATCH …/endpoints/{endpoint_id}` — autoscaling (min/max CU), suspend timeout

### Databases
- `GET|POST /projects/{project_id}/branches/{branch_id}/databases`
- `PATCH|DELETE …/databases/{database_name}`

### Roles
- `GET|POST /projects/{project_id}/branches/{branch_id}/roles`
- `POST …/roles/{role_name}/reset_password`
- `DELETE …/roles/{role_name}`

### Operations (seguimiento async)
- `GET /projects/{project_id}/operations/{operation_id}` — poll de `status`
  (`running` → `finished` | `failed`)

### Organizations & consumo
- `GET /organizations`, miembros, API keys de organización
- `GET /consumption_history/...` — métricas de uso/facturación

## Ejemplo: crear proyecto y obtener la cadena de conexión
```bash
curl -X POST https://console.neon.tech/api/v2/projects \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project":{"name":"mi-app","region_id":"aws-us-east-1"}}'
# La respuesta incluye connection_uris[].connection_uri  → esa es la DATABASE_URL
```

## Ejemplo: crear una rama con compute read-write
```bash
curl -X POST https://console.neon.tech/api/v2/projects/$PID/branches \
  -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" \
  -d '{"branch":{"name":"pr-42"},"endpoints":[{"type":"read_write"}]}'
```

## Notas
- Preferí el **CLI** (`neonctl`, ver `references/cli.md`) para tareas
  interactivas; la API cruda para integraciones y Terraform.
- Hay provider de **Terraform** y un SDK TS (`@neondatabase/api-client`, y
  proyectos como `neon.ts`) que envuelven estos endpoints.
- Regiones típicas: `aws-us-east-1`, `aws-us-east-2`, `aws-eu-central-1`,
  `aws-ap-southeast-1`, `azure-eastus2`, etc. Confirmá en Console.
- Script de ejemplo end-to-end en `templates/provision-api.sh`.
