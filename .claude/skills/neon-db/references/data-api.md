# Neon Data API (REST sobre tus tablas)

API REST autogenerada (basada en **PostgREST**) que expone tus tablas como
endpoints HTTP. Permite leer/escribir **desde el navegador o el cliente**
**sin backend propio** — la seguridad la da **Row Level Security (RLS)** +
tokens JWT, no una contraseña de Postgres. Es la excepción autorizada a "nunca
consultar desde el cliente".

## Cuándo usarla
- SPAs / apps estáticas sin servidor propio que necesitan CRUD.
- Prototipos rápidos estilo "Postgres como backend".
- Cuando ya usás **Neon Auth** (los JWT encajan directo).

Si necesitás lógica de servidor, validaciones complejas o secretos de terceros,
preferí una función serverless con el driver (`references/driver.md`).

## Cómo se habilita
- Se activa **por rama y por base de datos** (cada rama tiene su config).
- Console → tu proyecto → seleccioná la rama → Data API → Enable. O por CLI.
- Base path de los endpoints:
  `/{project}/branches/{branch}/data-api/{database}` (te da una URL base propia).

## Modelo de seguridad (imprescindible)
1. **Activá RLS en toda tabla expuesta.** Sin políticas, la tabla queda
   inaccesible (deny-by-default) — que es lo correcto.
2. Definí políticas que filtren por el usuario del token, p.ej.:
```sql
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dueño ve lo suyo" ON notes
  FOR SELECT USING (user_id = auth.user_id());

CREATE POLICY "dueño inserta lo suyo" ON notes
  FOR INSERT WITH CHECK (user_id = auth.user_id());
```
3. El cliente manda `Authorization: Bearer <JWT>` (de Neon Auth u otro emisor
   configurado). PostgREST aplica las políticas con ese contexto.

## Uso desde el cliente
Se puede llamar con `fetch` o con el SDK de PostgREST
(`@supabase/postgrest-js`, compatible):
```js
import { PostgrestClient } from '@supabase/postgrest-js';
const rest = new PostgrestClient(DATA_API_URL, {
  headers: { Authorization: `Bearer ${jwt}` },
});
const { data, error } = await rest.from('notes').select('*').eq('archived', false);
await rest.from('notes').insert({ title: 'hola' });
```
O REST puro:
```
GET  {DATA_API_URL}/notes?archived=eq.false      Authorization: Bearer <jwt>
POST {DATA_API_URL}/notes                          body JSON
```

## Reglas
- **Nunca** pongas la `DATABASE_URL` en el cliente aunque uses Data API: el
  cliente solo usa la URL de la Data API + el JWT.
- Exponé solo las tablas/columnas necesarias; el resto sin políticas queda
  bloqueado.
- Revisá siempre las políticas RLS: son la única barrera. Ver
  `references/security.md`.
