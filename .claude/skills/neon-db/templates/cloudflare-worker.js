import { neon } from '@neondatabase/serverless';

/*
  Cloudflare Worker / Pages Function.
  En Workers la conexión se lee de `env`, NO de process.env.
  Configurar el secreto:  wrangler secret put DATABASE_URL
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Método no permitido' }, 405);
    }
    if (!env.DATABASE_URL) {
      return json({ ok: false, error: 'Falta DATABASE_URL' }, 500);
    }

    let body = {};
    try { body = await request.json(); } catch { /* body inválido */ }
    const email = String(body.email || '').trim().toLowerCase();

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return json({ ok: false, error: 'Correo inválido' }, 400);
    }

    try {
      const sql = neon(env.DATABASE_URL);
      const rows = await sql`
        INSERT INTO whitelist (email) VALUES (${email})
        ON CONFLICT (email) DO NOTHING
        RETURNING id`;
      return json({ ok: true, already: rows.length === 0 });
    } catch (err) {
      console.error('db error:', err);
      return json({ ok: false, error: 'Error del servidor' }, 500);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
