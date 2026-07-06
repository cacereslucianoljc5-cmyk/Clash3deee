import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

/*
  Next.js App Router — Route Handler.
  Colocar en: app/api/whitelist/route.ts
  Requiere la env var DATABASE_URL (Vercel/hosting → Environment Variables).
  Corre en el servidor: DATABASE_URL nunca llega al navegador.
*/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: 'Falta DATABASE_URL' }, { status: 500 });
  }

  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* body inválido */
  }
  const email = String(body.email || '').trim().toLowerCase();

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Correo inválido' }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      INSERT INTO whitelist (email) VALUES (${email})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;
    return NextResponse.json({ ok: true, already: rows.length === 0 });
  } catch (err) {
    console.error('db error:', err);
    return NextResponse.json({ ok: false, error: 'Error del servidor' }, { status: 500 });
  }
}
