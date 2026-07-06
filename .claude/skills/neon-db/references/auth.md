# Neon Auth (autenticación de usuarios lista para usar)

Servicio de autenticación gestionado, integrado con tu base Neon. Maneja
registro/login, sesiones, OAuth (Google, GitHub, etc.) y **sincroniza los
usuarios a una tabla de tu Postgres**, para que puedas hacer JOINs con tus datos
sin ETL. Emite JWT que encajan con la **Data API + RLS** (`references/data-api.md`).

## Qué te da
- Componentes/SDK de frontend para login, registro y gestión de sesión.
- Usuarios sincronizados en el esquema `neon_auth` (p.ej. tabla
  `neon_auth.users_sync`) de tu base — consultable con SQL normal.
- JWT verificables para autorizar la Data API o tu propio backend.

## Puesta en marcha (alto nivel)
1. Habilitá Neon Auth en Console (o CLI) para el proyecto/rama.
2. Instalá el SDK que corresponda a tu framework (React/Next.js, etc.) y
   configurá las claves públicas del proyecto (client-side) y el secreto
   (server-side) según la doc.
3. Envolvé la app con el provider de auth y usá sus componentes/hooks para
   login y sesión.
4. En el backend/Data API, verificá el JWT y usá el `user_id` en tus políticas
   RLS o en tus queries.

## Consultar usuarios desde SQL
```sql
-- Unir tus datos con los usuarios sincronizados por Neon Auth
SELECT n.*, u.email
FROM notes n
JOIN neon_auth.users_sync u ON u.id = n.user_id
WHERE n.archived = false;
```

## RLS con el usuario autenticado
Con Neon Auth + Data API, en las políticas podés usar el identificador del token
(p.ej. `auth.user_id()`), de modo que cada usuario solo ve/escribe lo suyo:
```sql
CREATE POLICY "solo mis notas" ON notes
  FOR ALL USING (user_id = auth.user_id());
```

## Notas
- Los nombres exactos de SDK/paquetes y funciones auxiliares evolucionan;
  confirmá en la doc de Neon Auth y con `neonctl <auth?> --help`.
- Neon Auth está pensado para que **agentes y apps** tengan acceso por usuario
  sin montar un proveedor de identidad externo. Si ya usás Clerk/Auth0/NextAuth,
  podés seguir con ellos y solo emitir JWT compatibles para la Data API.
- Nunca expongas secretos de servidor de Auth en el cliente.
