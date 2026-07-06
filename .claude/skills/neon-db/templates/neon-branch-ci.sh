#!/usr/bin/env bash
# Base efímera por PR usando el CLI de Neon.
# Requiere: NEON_API_KEY exportada, neonctl instalado (o npx), jq.
# Uso:
#   ./neon-branch-ci.sh create <pr-number>   -> crea rama y devuelve DATABASE_URL
#   ./neon-branch-ci.sh delete <pr-number>   -> borra la rama
set -euo pipefail

CMD="${1:?create|delete}"
PR="${2:?número de PR}"
BRANCH="pr-${PR}"
NEON="npx --yes neonctl"   # o 'neonctl' si está instalado global

case "$CMD" in
  create)
    # Crea la rama desde la default si no existe (idempotente-ish)
    $NEON branches create --name "$BRANCH" >/dev/null 2>&1 || true
    DBURL=$($NEON connection-string "$BRANCH" --pooled --output json | jq -r '.uri // .connection_string')
    echo "DATABASE_URL=$DBURL"
    # Ejemplo: correr migraciones sobre la rama
    # DATABASE_URL="$DBURL" npm run migrate
    ;;
  delete)
    $NEON branches delete "$BRANCH"
    echo "Rama $BRANCH borrada."
    ;;
  *)
    echo "Comando inválido: $CMD (usá create|delete)" >&2
    exit 1
    ;;
esac
