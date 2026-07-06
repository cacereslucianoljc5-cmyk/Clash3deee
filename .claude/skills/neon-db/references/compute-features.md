# Compute: autoscaling, scale-to-zero, replicas, pooling, PITR, CDC

Funciones de infraestructura de Neon. La mayoría se configuran por **compute
endpoint** (cada rama tiene el suyo) en Console → Branches → Compute, por API
(`PATCH …/endpoints/{id}`) o CLI.

## Autoscaling
El compute escala CPU/RAM automáticamente entre un mínimo y un máximo de
**Compute Units (CU)** según la carga (1 CU ≈ 1 vCPU / 4 GB).
- Configurás `autoscaling_limit_min_cu` y `autoscaling_limit_max_cu`.
- Ideal para picos: no sobredimensionás ni te quedás corto.

## Scale-to-zero (suspensión automática)
Si un compute no recibe conexiones por un tiempo, **se suspende** y deja de
facturar CPU (seguís pagando solo almacenamiento). Al llegar la próxima conexión
se reactiva en ~cientos de ms (cold start).
- Configurable: `suspend_timeout_seconds`.
- Perfecto para ramas de dev/preview y proyectos de bajo tráfico.
- Si necesitás latencia constante sin cold starts, subí el timeout o desactivá
  scale-to-zero en producción.

## Read replicas
Computes **read-only** sobre los mismos datos (sin copiar almacenamiento).
Descargan analítica/reportes o lecturas pesadas de la instancia principal.
```bash
neonctl branches add-compute main --type read_only
```
Cada replica tiene su propia cadena de conexión; apuntá ahí las lecturas.

## Connection pooling (PgBouncer)
Neon ofrece un pooler integrado. Usá el host con **`-pooler`** para soportar
miles de conexiones cortas (serverless).
- Cadena "pooled": `neonctl cs <branch> --pooled` o la variante *Pooled* en
  Console → Connect.
- Modo **transaction pooling**: no soporta features de sesión (prepared
  statements con estado, `SET` persistente, `LISTEN/NOTIFY`). Para eso usá la
  cadena **directa** (sin `-pooler`) con `Pool`/`Client`.
- Regla práctica: **pooled** para funciones serverless HTTP; **directa** para
  migraciones y servidores de larga vida con sesión.

## Point-in-time restore / Time travel
Gracias al storage con historial, podés:
- Restaurar una rama a un instante/LSN anterior (`references/branching.md`).
- Consultar el pasado creando una rama desde ese punto.
La ventana de retención depende del plan.

## Logical replication (CDC)
Neon puede actuar como **publisher** o **subscriber** de replicación lógica:
- Sacar cambios hacia otro Postgres, un data warehouse, Kafka, etc.
- Migrar hacia/desde Neon con downtime mínimo.
Requiere habilitar `wal_level=logical` (Neon lo soporta) y crear `PUBLICATION`/
`SUBSCRIPTION`.

## Seguridad de red
- **IP Allow**: restringí el acceso a un allowlist de IPs (planes con la
  feature). `neonctl ip-allow`.
- **Protected branches**: bloquean borrado/escrituras accidentales en prod.
- Conexiones siempre por TLS (`sslmode=require`).

## Regiones
Elegí la región más cercana a tu compute de app para bajar latencia (AWS/Azure,
varias regiones). Se fija al crear el proyecto.
