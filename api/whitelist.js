import { neon } from '@neondatabase/serverless';

/*
  Función serverless de Vercel: registra correos en la whitelist de $SIEGE.

  - La conexión a Neon vive SOLO aquí (servidor). El navegador nunca ve
    la cadena de conexión ni credenciales de la base de datos.
  - Requiere la variable de entorno DATABASE_URL (cadena de conexión de
    Neon, pooler recomendado). Se configura en Vercel → Settings →
    Environment Variables. Nunca se commitea al repositorio.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  if (!process.env.DATABASE_URL) {
    return res
      .status(500)
      .json({ ok: false, error: 'Servidor sin configurar (falta DATABASE_URL)' });
  }

  // Vercel parsea automáticamente el body JSON.
  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const honeypot = String(body.website || '').trim(); // campo trampa anti-bots

  if (honeypot) {
    // Un bot rellenó el campo oculto: respondemos ok sin guardar nada.
    return res.status(200).json({ ok: true, already: false });
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Correo inválido' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      INSERT INTO whitelist (email)
      VALUES (${email})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    // rows vacío => el correo ya existía (conflicto ignorado).
    return res.status(200).json({ ok: true, already: rows.length === 0 });
  } catch (err) {
    console.error('whitelist insert error:', err);
    return res.status(500).json({ ok: false, error: 'No se pudo registrar. Intentá de nuevo.' });
  }
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
