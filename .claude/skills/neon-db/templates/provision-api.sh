#!/usr/bin/env bash
# Provisionar Neon vía API REST de gestión (end-to-end).
# Requiere: NEON_API_KEY (napi_...) exportada. NO commitear la key.
#   export NEON_API_KEY=napi_xxx
#   ./provision-api.sh
set -euo pipefail

API="https://console.neon.tech/api/v2"
AUTH=(-H "Authorization: Bearer ${NEON_API_KEY:?falta NEON_API_KEY}" -H "Content-Type: application/json")
REGION="${NEON_REGION:-aws-us-east-1}"

echo "==> Creando proyecto…"
CREATE=$(curl -sS -X POST "$API/projects" "${AUTH[@]}" \
  -d "{\"project\":{\"name\":\"mi-app\",\"region_id\":\"$REGION\"}}")

PROJECT_ID=$(echo "$CREATE" | jq -r '.project.id')
# La cadena de conexión inicial (pooled si está disponible):
DATABASE_URL=$(echo "$CREATE" | jq -r '.connection_uris[0].connection_uri')

echo "PROJECT_ID=$PROJECT_ID"
echo "DATABASE_URL=$DATABASE_URL   # <- ponela en las env vars de tu hosting"

# --- opcional: crear una rama con compute read-write ---
# curl -sS -X POST "$API/projects/$PROJECT_ID/branches" "${AUTH[@]}" \
#   -d '{"branch":{"name":"pr-1"},"endpoints":[{"type":"read_write"}]}' | jq

# --- opcional: aplicar el esquema con psql ---
# psql "$DATABASE_URL" -f schema.sql

echo "==> Listo. Ejecutá tu schema.sql contra DATABASE_URL."
