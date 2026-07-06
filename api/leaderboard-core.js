// Framework-agnostic leaderboard + users logic shared by:
//   - the Vercel serverless functions (api/leaderboard.js, api/users.js)
//   - the Vite dev middleware (vite.config.js -> neonDevApi plugin)
//
// Persistence uses Neon (serverless Postgres) when DATABASE_URL is set.
// Without it (local dev / demo) it falls back to an in-memory store so the
// full flow still works. The browser client additionally falls back to
// localStorage when the API itself is unreachable (e.g. static hosting).

const MAX_ROWS = 20;

let memRows = []; // in-memory scores fallback: { name, score, wallet, created_at }
const memUsers = new Map(); // wallet -> { wallet, name, games_played, best_score, created_at, last_seen }
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

// Which persistence backend is active. 'neon' => scores are truly global and
// durable; 'memory' => DATABASE_URL is not set, so data is ephemeral (per
// serverless instance) and NOT global. Surfaced to the UI so players can tell.
export function getBackend() {
  return process.env.DATABASE_URL ? 'neon' : 'memory';
}

async function ensureTables(sql) {
  if (!neonReady) {
    neonReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          wallet       TEXT PRIMARY KEY,
          name         TEXT NOT NULL,
          games_played INTEGER NOT NULL DEFAULT 0,
          best_score   INTEGER NOT NULL DEFAULT 0,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_seen    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS scores (
          id         BIGSERIAL PRIMARY KEY,
          name       TEXT NOT NULL,
          wallet     TEXT,
          score      INTEGER NOT NULL CHECK (score >= 0),
          signature  TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return neonReady;
}

function sanitizeName(name) {
  const s = (name ?? 'anon').toString().trim();
  if (!s) return 'anon';
  return s.slice(0, 64);
}

function cleanWalletStr(wallet) {
  return wallet ? wallet.toString().trim().slice(0, 64) : null;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

// Create the user row if it's new, otherwise refresh name/last_seen. Called the
// moment a wallet connects, so every connected player exists as a "user".
export async function upsertUser({ wallet, name }) {
  const cleanWallet = cleanWalletStr(wallet);
  if (!cleanWallet) throw new Error('wallet is required');
  const cleanName = sanitizeName(name || cleanWallet);

  const sql = await getSql();
  if (!sql) {
    const existing = memUsers.get(cleanWallet);
    const now = new Date().toISOString();
    const row = existing
      ? { ...existing, name: cleanName, last_seen: now }
      : {
          wallet: cleanWallet,
          name: cleanName,
          games_played: 0,
          best_score: 0,
          created_at: now,
          last_seen: now,
        };
    memUsers.set(cleanWallet, row);
    return { ...row, isNew: !existing };
  }

  await ensureTables(sql);
  const rows = await sql`
    INSERT INTO users (wallet, name)
    VALUES (${cleanWallet}, ${cleanName})
    ON CONFLICT (wallet) DO UPDATE
      SET name = EXCLUDED.name, last_seen = now()
    RETURNING wallet, name, games_played, best_score, created_at, last_seen,
              (xmax = 0) AS is_new
  `;
  const row = rows[0] || {};
  return {
    wallet: row.wallet,
    name: row.name,
    games_played: row.games_played,
    best_score: row.best_score,
    created_at: row.created_at,
    last_seen: row.last_seen,
    isNew: !!row.is_new,
  };
}

export async function getUser(wallet) {
  const cleanWallet = cleanWalletStr(wallet);
  if (!cleanWallet) return null;

  const sql = await getSql();
  if (!sql) {
    return memUsers.get(cleanWallet) || null;
  }
  await ensureTables(sql);
  const rows = await sql`
    SELECT wallet, name, games_played, best_score, created_at, last_seen
    FROM users
    WHERE wallet = ${cleanWallet}
  `;
  return rows[0] || null;
}

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

export async function getTopScores(limit = MAX_ROWS) {
  const n = Math.min(Math.max(parseInt(limit, 10) || MAX_ROWS, 1), 100);
  const sql = await getSql();
  if (!sql) {
    return [...memRows].sort((a, b) => b.score - a.score).slice(0, n);
  }
  await ensureTables(sql);
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
  const cleanWallet = cleanWalletStr(wallet);
  const cleanName = sanitizeName(name || cleanWallet);
  const cleanSig = signature ? signature.toString().slice(0, 200) : null;

  const sql = await getSql();
  if (!sql) {
    memRows.push({
      name: cleanName,
      wallet: cleanWallet,
      score: cleanScore,
      created_at: new Date().toISOString(),
    });
    if (cleanWallet) {
      const now = new Date().toISOString();
      const u = memUsers.get(cleanWallet) || {
        wallet: cleanWallet,
        name: cleanName,
        games_played: 0,
        best_score: 0,
        created_at: now,
        last_seen: now,
      };
      u.games_played += 1;
      u.best_score = Math.max(u.best_score, cleanScore);
      u.last_seen = now;
      memUsers.set(cleanWallet, u);
    }
    return { ok: true, persisted: 'memory' };
  }

  await ensureTables(sql);

  // Make sure a connected player always has a user row (keeps aggregate stats
  // and the score history in sync, even if the score arrives before an explicit
  // register call).
  if (cleanWallet) {
    await sql`
      INSERT INTO users (wallet, name)
      VALUES (${cleanWallet}, ${cleanName})
      ON CONFLICT (wallet) DO UPDATE SET last_seen = now()
    `;
    await sql`
      UPDATE users
      SET games_played = games_played + 1,
          best_score   = GREATEST(best_score, ${cleanScore}),
          last_seen    = now()
      WHERE wallet = ${cleanWallet}
    `;
  }

  await sql`
    INSERT INTO scores (name, wallet, score, signature)
    VALUES (${cleanName}, ${cleanWallet}, ${cleanScore}, ${cleanSig})
  `;
  return { ok: true, persisted: 'neon' };
}

// ---------------------------------------------------------------------------
// Dispatchers used by both server adapters. `body` is already-parsed JSON.
// ---------------------------------------------------------------------------

export async function handleLeaderboard({ method, query, body }) {
  try {
    if (method === 'GET') {
      const scores = await getTopScores(query?.limit);
      return { status: 200, json: { scores, backend: getBackend() } };
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

export async function handleUsers({ method, query, body }) {
  try {
    if (method === 'GET') {
      const user = await getUser(query?.wallet);
      if (!user) return { status: 404, json: { error: 'User not found' } };
      return { status: 200, json: { user } };
    }
    if (method === 'POST') {
      const user = await upsertUser(body || {});
      return { status: 200, json: { user } };
    }
    return { status: 405, json: { error: 'Method not allowed' } };
  } catch (err) {
    return { status: 500, json: { error: err.message || 'Server error' } };
  }
}
