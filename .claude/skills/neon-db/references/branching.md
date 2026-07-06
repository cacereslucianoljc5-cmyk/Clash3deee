# Branching (la función estrella de Neon)

Una **rama** es una copia **instantánea copy-on-write** de tus datos + esquema.
Se crea en segundos sin duplicar almacenamiento. Casos de uso: una base por Pull
Request, entornos de dev/staging/preview, pruebas destructivas, recuperación
ante errores (time-travel / point-in-time restore).

Conceptos:
- **Rama por defecto** (`production`/`main`): la principal, siempre activa.
- **Rama hija:** parte de un punto en el tiempo del padre. Sus escrituras son
  independientes; comparte los datos anteriores por copy-on-write.
- **Root / parent:** toda rama (salvo la default) tiene un padre.
- Cada rama tiene su **propia cadena de conexión** y su compute endpoint.

## Cómo crear ramas

### Con el CLI (rápido para dev)
```bash
neonctl branches create --name pr-123
neonctl connection-string pr-123          # cadena de conexión de esa rama
neonctl branches delete pr-123            # borrarla al cerrar el PR
```

### Con la API (CI/automación) — ver management-api.md
```bash
curl -X POST https://console.neon.tech/api/v2/projects/$PROJECT_ID/branches \
  -H "Authorization: Bearer $NEON_API_KEY" -H "Content-Type: application/json" \
  -d '{"branch":{"name":"pr-123"},"endpoints":[{"type":"read_write"}]}'
```

### Con integraciones (automático)
La integración de Vercel crea una rama por cada Preview Deployment. GitHub
Actions oficiales crean/borran ramas por PR. Ver `references/integrations.md`.

## Operaciones clave

### Reset (traer los datos del padre a la rama)
Descarta los cambios de la rama y la vuelve a igualar al padre:
```bash
neonctl branches reset pr-123 --parent
```

### Restore / Time-travel (point-in-time restore, PITR)
Restaurá una rama a un instante o LSN anterior (deshacer un `DROP`/`DELETE`):
```bash
# restaurar la rama a como estaba hace 30 minutos
neonctl branches restore main main@2025-01-01T00:00:00Z
```
También podés crear una rama *desde* un punto pasado del padre para inspeccionar
sin tocar producción. El historial de restore depende de la retención del plan.

### Schema diff entre ramas
```bash
neonctl branches schema-diff main pr-123
```

### Rama solo-esquema (schema-only)
Copia la estructura sin los datos (útil para datos sensibles):
crear la rama y luego cargar datos sintéticos, o usar la opción schema-only al
crearla desde la API/Console.

### Rama protegida
Marcá `production` como **protected** para bloquear borrados accidentales y
exigir aprobaciones. Se configura en Console o vía API (`protected: true`).

## Patrón "base efímera por PR" (CI)
1. Al abrir/actualizar el PR → crear rama `pr-<n>` desde `main`.
2. Correr migraciones sobre esa rama (`references/migrations.md`).
3. Desplegar el preview apuntando a la `DATABASE_URL` de la rama.
4. Al cerrar/mergear el PR → borrar la rama.

Ver script listo en `templates/neon-branch-ci.sh`.

## Buenas prácticas
- Borrá las ramas efímeras al terminar (consumen compute-time si están activas).
- Aprovechá **scale-to-zero**: una rama sin tráfico suspende su compute y no
  factura CPU. Ver `references/compute-features.md`.
- Nombrá las ramas de forma predecible (`pr-123`, `dev-<usuario>`) para
  automatizar creación/borrado.
