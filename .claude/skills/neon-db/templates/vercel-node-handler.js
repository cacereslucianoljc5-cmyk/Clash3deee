import { neon } from '@neondatabase/serverless';

/*
  Función serverless de Vercel (colocar en api/<nombre>.js).
  La conexión a Neon vive SOLO aquí; el navegador nunca ve DATABASE_URL.
  Requiere la env var DATABASE_URL (Vercel → Settings → Environment Variables).

  Ejemplo genérico: recibe un POST { email } y lo guarda. Adaptalo a tu caso.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ ok: false, error: 'Falta DATABASE_URL' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const email = String(body.email || '').trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Correo inválido' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      INSERT INTO whitelist (email) VALUES (${email})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;
    return res.status(200).json({ ok: true, already: rows.length === 0 });
  } catch (err) {
    console.error('db error:', err);
    return res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
