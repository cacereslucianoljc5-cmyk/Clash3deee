import { neon } from '@neondatabase/serverless';

/*
  Cliente reutilizable para apps Node/Express/Fastify.
  Importalo donde necesites la base:  import { sql } from './db/client.js'
  Requiere la env var DATABASE_URL (usá dotenv en local: import 'dotenv/config').
*/

if (!process.env.DATABASE_URL) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

export const sql = neon(process.env.DATABASE_URL);

/* --------- Ejemplo de uso en una ruta de Express ---------

import express from 'express';
import { sql } from './db/client.js';

const app = express();
app.use(express.json());

app.post('/api/whitelist', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Correo inválido' });
  }
  try {
    const rows = await sql`
      INSERT INTO whitelist (email) VALUES (${email})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;
    res.json({ ok: true, already: rows.length === 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

app.listen(3000);
----------------------------------------------------------- */
