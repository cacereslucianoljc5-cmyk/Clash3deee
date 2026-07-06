// Shared database layer for the Siege Kingdoms backend.
//
// Identity is the Solana wallet address: connecting a wallet upserts a `users`
// row (with an editable username); every game result is stored in `scores`
// linked to that wallet. Used by the Vercel serverless functions
// (api/user.js, api/leaderboard.js) and by the Vite dev middleware.
//
// Persistence uses Neon (serverless Postgres) when DATABASE_URL is set;
// otherwise it falls back to an in-memory store so the flow works locally.

const MAX_ROWS = 20;

// --- in-memory fallback stores ---------------------------------------------
const memUsers = new Map(); // wallet -> { wallet, username, created_at, last_seen }
const memScores = []; // { wallet, username, score, signature, created_at }

let neonSql = null;
let tablesReady = null;

async function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!neonSql) {
    const { neon } = await import('@neondatabase/serverless');
    neonSql = neon(url);
  }
  return neonSql;
}

async function ensureTables(sql) {
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id         BIGSERIAL PRIMARY KEY,
          wallet     TEXT UNIQUE NOT NULL,
          username   TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_seen  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS scores (
          id         BIGSERIAL PRIMARY KEY,
          wallet     TEXT,
          username   TEXT NOT NULL,
          score      INTEGER NOT NULL CHECK (score >= 0),
          signature  TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC, created_at ASC)`;
    })();
  }
  return tablesReady;
}

// --- helpers ---------------------------------------------------------------
export function shortWallet(w) {
  if (!w) return 'anon';
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

function cleanUsername(name, wallet) {
  const s = (name ?? '').toString().trim();
  if (s) return s.slice(0, 24);
  return shortWallet(wallet);
}

function cleanWallet(w) {
  if (!w) return null;
  const s = w.toString().trim();
  // Base58 Solana addresses are 32-44 chars; be lenient but bounded.
  if (s.length < 32 || s.length > 64) return null;
  return s;
}

// --- users -----------------------------------------------------------------
export async function upsertUser({ wallet, username }) {
  const w = cleanWallet(wallet);
  if (!w) throw new Error('wallet inválida');
  const name = cleanUsername(username, w);

  const sql = await getSql();
  if (!sql) {
    const existing = memUsers.get(w);
    if (existing) {
      existing.last_seen = new Date().toISOString();
      // Only overwrite username if the caller explicitly provided one.
      if (username != null && username.toString().trim()) existing.username = name;
      return profileFromMem(w);
    }
    memUsers.set(w, {
      wallet: w,
      username: name,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });
    return profileFromMem(w);
  }

  await ensureTables(sql);
  const providedName = username != null && `${username}`.trim() !== '';
  if (providedName) {
    // Caller sent a username -> create or overwrite it.
    await sql`
      INSERT INTO users (wallet, username) VALUES (${w}, ${name})
      ON CONFLICT (wallet) DO UPDATE
        SET username = EXCLUDED.username, last_seen = now()
    `;
  } else {
    // No username -> create with a default, or just refresh last_seen.
    await sql`
      INSERT INTO users (wallet, username) VALUES (${w}, ${name})
      ON CONFLICT (wallet) DO UPDATE SET last_seen = now()
    `;
  }
  return getProfile(w);
}

export async function setUsername({ wallet, username }) {
  const w = cleanWallet(wallet);
  if (!w) throw new Error('wallet inválida');
  const name = cleanUsername(username, w);

  const sql = await getSql();
  if (!sql) {
    const u = memUsers.get(w) || {
      wallet: w,
      created_at: new Date().toISOString(),
    };
    u.username = name;
    u.last_seen = new Date().toISOString();
    memUsers.set(w, u);
    return profileFromMem(w);
  }
  await ensureTables(sql);
  await sql`
    INSERT INTO users (wallet, username) VALUES (${w}, ${name})
    ON CONFLICT (wallet) DO UPDATE SET username = ${name}, last_seen = now()
  `;
  return getProfile(w);
}

function profileFromMem(wallet) {
  const u = memUsers.get(wallet);
  if (!u) return null;
  const mine = memScores.filter((s) => s.wallet === wallet);
  const best = mine.reduce((m, s) => Math.max(m, s.score), 0);
  return {
    wallet: u.wallet,
    username: u.username,
    createdAt: u.created_at,
    games: mine.length,
    bestScore: best,
  };
}

export async function getProfile(wallet) {
  const w = cleanWallet(wallet);
  if (!w) return null;

  const sql = await getSql();
  if (!sql) return profileFromMem(w);

  await ensureTables(sql);
  const rows = await sql`
    SELECT u.wallet, u.username, u.created_at,
           COALESCE(COUNT(s.id), 0)  AS games,
           COALESCE(MAX(s.score), 0) AS best_score
    FROM users u
    LEFT JOIN scores s ON s.wallet = u.wallet
    WHERE u.wallet = ${w}
    GROUP BY u.wallet, u.username, u.created_at
  `;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    wallet: r.wallet,
    username: r.username,
    createdAt: r.created_at,
    games: Number(r.games),
    bestScore: Number(r.best_score),
  };
}

// --- scores ----------------------------------------------------------------
export async function submitScore({ wallet, username, score, signature }) {
  const w = cleanWallet(wallet);
  const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
  const name = cleanUsername(username, w);
  const sig = signature ? signature.toString().slice(0, 200) : null;

  const sql = await getSql();
  if (!sql) {
    if (w && !memUsers.has(w)) {
      memUsers.set(w, {
        wallet: w,
        username: name,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      });
    }
    memScores.push({
      wallet: w,
      username: name,
      score: cleanScore,
      signature: sig,
      created_at: new Date().toISOString(),
    });
    return { ok: true, persisted: 'memory' };
  }

  await ensureTables(sql);
  if (w) {
    // Make sure a user row exists so the leaderboard join has a username.
    await sql`
      INSERT INTO users (wallet, username) VALUES (${w}, ${name})
      ON CONFLICT (wallet) DO UPDATE SET last_seen = now()
    `;
  }
  await sql`
    INSERT INTO scores (wallet, username, score, signature)
    VALUES (${w}, ${name}, ${cleanScore}, ${sig})
  `;
  return { ok: true, persisted: 'neon' };
}

export async function getTopScores(limit = MAX_ROWS) {
  const n = Math.min(Math.max(parseInt(limit, 10) || MAX_ROWS, 1), 100);

  const sql = await getSql();
  if (!sql) {
    // Best score per wallet (registered) / per name (anon).
    const byKey = new Map();
    for (const s of memScores) {
      const key = s.wallet || `anon:${s.username}`;
      const name = s.wallet ? memUsers.get(s.wallet)?.username || s.username : s.username;
      const prev = byKey.get(key);
      if (!prev || s.score > prev.score) byKey.set(key, { name, wallet: s.wallet, score: s.score });
    }
    return [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, n);
  }

  await ensureTables(sql);
  const rows = await sql`
    SELECT COALESCE(u.username, s.username, 'anon') AS name,
           s.wallet,
           MAX(s.score) AS score
    FROM scores s
    LEFT JOIN users u ON u.wallet = s.wallet
    GROUP BY s.wallet, COALESCE(u.username, s.username, 'anon')
    ORDER BY score DESC
    LIMIT ${n}
  `;
  return rows.map((r) => ({ name: r.name, wallet: r.wallet, score: Number(r.score) }));
}
