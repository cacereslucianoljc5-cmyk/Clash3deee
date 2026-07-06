// Framework-agnostic leaderboard logic shared by:
//   - the Vercel serverless function (api/leaderboard.js)
//   - the Vite dev middleware (vite.config.js -> neonDevApi plugin)
//
// Persistence uses Neon (serverless Postgres) when DATABASE_URL is set.
// Without it (local dev / demo) it falls back to an in-memory store so the
// full flow still works. The browser client additionally falls back to
// localStorage when the API itself is unreachable (e.g. static hosting).

const MAX_ROWS = 20;

let memRows = []; // in-memory fallback: { name, score, wallet, created_at }
let neonSql = null;
let neonReady = null;

async function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!neonSql) {
    // Imported lazily so the browser bundle never pulls this in.
    const { neon } = await import('@neondatabase/serverless');
    neonSql = neon(url);
  }
  return neonSql;
}

async function ensureTable(sql) {
  if (!neonReady) {
    neonReady = sql`
      CREATE TABLE IF NOT EXISTS scores (
        id         BIGSERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        wallet     TEXT,
        score      INTEGER NOT NULL CHECK (score >= 0),
        signature  TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }
  return neonReady;
}

function sanitizeName(name) {
  const s = (name ?? 'anon').toString().trim();
  if (!s) return 'anon';
  return s.slice(0, 64);
}

export async function getTopScores(limit = MAX_ROWS) {
  const n = Math.min(Math.max(parseInt(limit, 10) || MAX_ROWS, 1), 100);
  const sql = await getSql();
  if (!sql) {
    return [...memRows].sort((a, b) => b.score - a.score).slice(0, n);
  }
  await ensureTable(sql);
  const rows = await sql`
    SELECT name, wallet, score, created_at
    FROM scores
    ORDER BY score DESC, created_at ASC
    LIMIT ${n}
  `;
  return rows;
}

export async function submitScore({ name, score, wallet, signature }) {
  const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
  const cleanName = sanitizeName(name || wallet);
  const cleanWallet = wallet ? wallet.toString().slice(0, 64) : null;
  const cleanSig = signature ? signature.toString().slice(0, 200) : null;

  const sql = await getSql();
  if (!sql) {
    memRows.push({
      name: cleanName,
      wallet: cleanWallet,
      score: cleanScore,
      created_at: new Date().toISOString(),
    });
    return { ok: true, persisted: 'memory' };
  }
  await ensureTable(sql);
  await sql`
    INSERT INTO scores (name, wallet, score, signature)
    VALUES (${cleanName}, ${cleanWallet}, ${cleanScore}, ${cleanSig})
  `;
  return { ok: true, persisted: 'neon' };
}

// Dispatch used by both server adapters. `body` is already-parsed JSON.
export async function handleLeaderboard({ method, query, body }) {
  try {
    if (method === 'GET') {
      const scores = await getTopScores(query?.limit);
      return { status: 200, json: { scores } };
    }
    if (method === 'POST') {
      const result = await submitScore(body || {});
      return { status: 200, json: result };
    }
    return { status: 405, json: { error: 'Method not allowed' } };
  } catch (err) {
    return { status: 500, json: { error: err.message || 'Server error' } };
  }
}
