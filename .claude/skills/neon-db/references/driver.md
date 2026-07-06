# Driver `@neondatabase/serverless`

Driver oficial de Neon. Habla Postgres sobre **HTTP** (consultas one-shot) o
**WebSocket** (sesiones con estado). Funciona en Node, edge (Vercel Edge,
Cloudflare Workers), Deno y el navegador *solo* vía Data API (no con la cadena
de conexión directa).

`npm install @neondatabase/serverless`

## 1. `neon()` — consultas HTTP (lo más común)
Ideal para serverless/edge: una consulta por request, sin manejar conexiones.

```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Tagged template → parametrizado y seguro
const rows = await sql`SELECT * FROM users WHERE id = ${id}`;

// Devuelve un array de filas (objetos). Para una sola fila:
const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
```

### Opciones de `neon(url, opts)`
```js
const sql = neon(url, {
  fullResults: true,   // devuelve { rows, rowCount, fields, command } en vez de solo rows
  arrayMode: true,     // filas como arrays en vez de objetos
  fetchOptions: { cache: 'no-store' }, // opciones passthrough a fetch()
});
```

### Consultas no-template (cuidado)
`sql.query()` acepta texto + params posicionales (útil para SQL dinámico):
```js
await sql.query('SELECT * FROM users WHERE id = $1', [id]);
```

### Transacción no interactiva (varias sentencias atómicas)
`sql.transaction([...])` envía un lote en una sola transacción HTTP:
```js
await sql.transaction([
  sql`UPDATE accounts SET balance = balance - ${amt} WHERE id = ${from}`,
  sql`UPDATE accounts SET balance = balance + ${amt} WHERE id = ${to}`,
]);
```
Limitación: no podés leer un resultado y decidir la siguiente sentencia dentro
del mismo `transaction()` (no es interactiva). Para eso usá `Pool`/`Client`.

## 2. `Pool` / `Client` — sesiones con estado (WebSocket)
API compatible con `node-postgres` (`pg`). Para servidores de larga vida,
transacciones interactivas, `LISTEN/NOTIFY`, cursores.

```js
import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

// Transacción interactiva
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const { rows: [acct] } = await client.query('SELECT balance FROM accounts WHERE id=$1 FOR UPDATE', [id]);
  if (acct.balance < amt) throw new Error('fondos insuficientes');
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id=$2', [amt, id]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
await pool.end();
```

## 3. `neonConfig` — configuración global (edge/entornos especiales)
```js
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';               // en Node < 22, para Pool/Client
neonConfig.webSocketConstructor = ws;
// neonConfig.poolQueryViaFetch = true;  // enruta pool.query simples por HTTP
```

## 4. ¿HTTP o WebSocket?
- **HTTP (`neon`)**: menor latencia por consulta suelta, sin estado. Elegí esto
  por defecto en funciones serverless/edge.
- **WebSocket (`Pool`/`Client`)**: cuando necesitás sesión (transacciones
  interactivas, `SET`, temp tables, `LISTEN/NOTIFY`, cursores).

## 5. Con ORMs / query builders
- **Drizzle:** `drizzle-orm/neon-http` (usa `neon()`) o `drizzle-orm/neon-serverless` (usa `Pool`). Ver `references/migrations.md`.
- **Prisma:** driver adapter `@prisma/adapter-neon`. Ver `references/migrations.md`.
- **Kysely, node-postgres:** compatibles vía `Pool`.

## 6. Errores comunes
- *"DATABASE_URL is not defined"* → falta la env var en el hosting.
- *WebSocket errors en Node* → definir `neonConfig.webSocketConstructor = ws`.
- *Timeouts en edge* → usar `neon()` HTTP, no `Pool`.
- *Contraseña en el bundle del cliente* → NUNCA importar este módulo con la
  cadena real en código que llega al navegador. Usá la Data API para el cliente.
