# Extensiones de Postgres en Neon

Neon soporta ~60+ extensiones. Se activan por base con `CREATE EXTENSION`.
Listá las disponibles con:
```sql
SELECT * FROM pg_available_extensions ORDER BY name;
```

## Habilitar / quitar
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER EXTENSION pg_trgm UPDATE;     -- actualizar versión
DROP EXTENSION pg_trgm;
```

## Las más útiles por caso

### IA / búsqueda
- `vector` (**pgvector**) — embeddings y k-NN (`references/ai-vector.md`).
- `pg_trgm` — similitud de texto / fuzzy search / autocompletado.
- `pg_search` / `pg_bm25` (según disponibilidad) — full-text estilo BM25.

### Datos geoespaciales
- `postgis` (+ `postgis_topology`, `postgis_raster`) — geometrías y consultas GIS.
- `cube`, `earthdistance` — distancias simples.

### Utilidades comunes
- `uuid-ossp` / `pgcrypto` — UUIDs, hashing, `gen_random_uuid()`, cifrado.
- `citext` — texto case-insensitive (emails, usernames).
- `hstore` — pares clave/valor.
- `ltree` — jerarquías/árboles.
- `unaccent` — quitar acentos para búsquedas.

### Rendimiento / observabilidad
- `pg_stat_statements` — estadísticas de queries (encontrar las lentas).
- `pg_prewarm`, `pgstattuple`.

### Time-series / analítica
- `timescaledb` (subconjunto, según disponibilidad) — hypertables.
- Funciones de ventana y `tablefunc` (`crosstab`).

### Replicación / integración
- Logical replication (CDC) — ver `references/compute-features.md`.

## Notas
- La lista y versiones exactas dependen de la versión de Postgres del proyecto
  (Neon soporta varias mayores). Verificá con `pg_available_extensions`.
- Algunas extensiones requieren activarse en cada **rama/base** por separado.
- Si una extensión no está, revisá la doc de Neon: puede requerir una versión de
  Postgres distinta o no estar soportada.
