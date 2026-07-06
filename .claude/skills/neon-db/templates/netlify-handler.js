import { neon } from '@neondatabase/serverless';

/*
  Netlify Function (colocar en netlify/functions/<nombre>.mjs).
  Requiere la env var DATABASE_URL (Netlify → Site settings → Environment).
  El endpoint queda en /.netlify/functions/<nombre>.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Método no permitido' }, { status: 405 });
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, error: 'Falta DATABASE_URL' }, { status: 500 });
  }

  let body = {};
  try { body = await req.json(); } catch { /* body inválido */ }
  const email = String(body.email || '').trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: 'Correo inválido' }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      INSERT INTO whitelist (email) VALUES (${email})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;
    return Response.json({ ok: true, already: rows.length === 0 });
  } catch (err) {
    console.error('db error:', err);
    return Response.json({ ok: false, error: 'Error del servidor' }, { status: 500 });
  }
};
