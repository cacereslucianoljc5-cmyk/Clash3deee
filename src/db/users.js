// Browser-side users client.
//
// Talks to the /api/users endpoint (Neon-backed in production). When that
// endpoint is unreachable — e.g. the site is served statically from GitHub
// Pages with no serverless host — it transparently falls back to a localStorage
// profile so the game keeps tracking the player's stats on this device.

const API_URL = import.meta.env.VITE_USERS_API_URL || '/api/users';
const LS_KEY = 'siege_users_v1';

function readLocalAll() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function writeLocalAll(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch (_) {
    /* storage full / disabled */
  }
}

function localUpsert(wallet, name) {
  const all = readLocalAll();
  const now = new Date().toISOString();
  const existing = all[wallet];
  const row = existing
    ? { ...existing, name: name || existing.name, last_seen: now }
    : {
        wallet,
        name: name || wallet,
        games_played: 0,
        best_score: 0,
        created_at: now,
        last_seen: now,
      };
  all[wallet] = row;
  writeLocalAll(all);
  return { ...row, isNew: !existing };
}

// Register (or refresh) the connected wallet as a user. Call this right after
// a wallet connects. Returns the user profile ({ wallet, name, games_played,
// best_score, ... }) plus a `source` tag.
export async function registerUser({ wallet, name }) {
  if (!wallet) throw new Error('wallet is required');
  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, name: name || null }),
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    return { source: 'api', user: data.user };
  } catch (_) {
    return { source: 'local', user: localUpsert(wallet, name) };
  }
}

// Fetch the latest stats for a wallet (e.g. to refresh best_score after a run).
export async function fetchUser(wallet) {
  if (!wallet) return { source: null, user: null };
  try {
    const resp = await fetch(`${API_URL}?wallet=${encodeURIComponent(wallet)}`, {
      headers: { Accept: 'application/json' },
    });
    if (resp.status === 404) return { source: 'api', user: null };
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    return { source: 'api', user: data.user };
  } catch (_) {
    return { source: 'local', user: readLocalAll()[wallet] || null };
  }
}

// Keep the local profile in sync after a run when the API isn't available.
export function recordLocalRun(wallet, score) {
  if (!wallet) return;
  const all = readLocalAll();
  const now = new Date().toISOString();
  const u = all[wallet] || {
    wallet,
    name: wallet,
    games_played: 0,
    best_score: 0,
    created_at: now,
    last_seen: now,
  };
  u.games_played += 1;
  u.best_score = Math.max(u.best_score, Math.max(0, Math.floor(score || 0)));
  u.last_seen = now;
  all[wallet] = u;
  writeLocalAll(all);
}
