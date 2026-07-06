// Browser-side client for the Neon-backed backend (users + scores).
//
// Talks to /api/user and /api/leaderboard. If the API is unreachable (e.g. a
// static build with no serverless host), it transparently falls back to a
// localStorage-backed store so the game stays fully playable.

const USER_URL = import.meta.env.VITE_API_URL_USER || '/api/user';
const BOARD_URL = import.meta.env.VITE_API_URL || '/api/leaderboard';

const LS_USERS = 'siege_users_v1';
const LS_SCORES = 'siege_scores_v1';

// --- localStorage fallback helpers -----------------------------------------
function lsGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || (key === LS_USERS ? '{}' : '[]'));
  } catch (_) {
    return key === LS_USERS ? {} : [];
  }
}
function lsSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {
    /* storage disabled */
  }
}

export function shortWallet(w) {
  if (!w) return 'anon';
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

function localProfile(wallet) {
  const users = lsGet(LS_USERS);
  const u = users[wallet];
  if (!u) return null;
  const scores = lsGet(LS_SCORES).filter((s) => s.wallet === wallet);
  return {
    wallet,
    username: u.username,
    createdAt: u.created_at,
    games: scores.length,
    bestScore: scores.reduce((m, s) => Math.max(m, s.score), 0),
    source: 'local',
  };
}

async function post(url, payload) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}`);
  return resp.json();
}

// --- users -----------------------------------------------------------------

// Called on wallet connect: create the user if new, else refresh it.
export async function connectUser({ wallet, username }) {
  try {
    const profile = await post(USER_URL, { wallet, username });
    return { ...profile, source: 'api' };
  } catch (_) {
    const users = lsGet(LS_USERS);
    if (!users[wallet]) {
      users[wallet] = {
        username: username || shortWallet(wallet),
        created_at: new Date().toISOString(),
      };
      lsSet(LS_USERS, users);
    }
    return localProfile(wallet);
  }
}

export async function renameUser({ wallet, username }) {
  try {
    const profile = await post(USER_URL, { action: 'rename', wallet, username });
    return { ...profile, source: 'api' };
  } catch (_) {
    const users = lsGet(LS_USERS);
    users[wallet] = { ...(users[wallet] || {}), username };
    lsSet(LS_USERS, users);
    return localProfile(wallet);
  }
}

export async function getProfile(wallet) {
  try {
    const resp = await fetch(`${USER_URL}?wallet=${encodeURIComponent(wallet)}`);
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const p = await resp.json();
    return p ? { ...p, source: 'api' } : null;
  } catch (_) {
    return localProfile(wallet);
  }
}

// --- scores ----------------------------------------------------------------
export async function submitScore(entry) {
  const payload = {
    wallet: entry.wallet || null,
    username: entry.username || (entry.wallet ? shortWallet(entry.wallet) : 'anon'),
    score: Math.max(0, Math.floor(entry.score || 0)),
    signature: entry.signature || null,
  };
  try {
    await post(BOARD_URL, payload);
    return { ok: true, source: 'api' };
  } catch (_) {
    const scores = lsGet(LS_SCORES);
    scores.push({ ...payload, created_at: new Date().toISOString() });
    lsSet(LS_SCORES, scores);
    return { ok: true, source: 'local' };
  }
}

export async function fetchLeaderboard(limit = 15) {
  try {
    const resp = await fetch(`${BOARD_URL}?limit=${limit}`, {
      headers: { Accept: 'application/json' },
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    return { source: 'api', scores: data.scores || [] };
  } catch (_) {
    // Best score per wallet/name from local scores.
    const byKey = new Map();
    for (const s of lsGet(LS_SCORES)) {
      const key = s.wallet || `anon:${s.username}`;
      const prev = byKey.get(key);
      if (!prev || s.score > prev.score)
        byKey.set(key, { name: s.username, wallet: s.wallet, score: s.score });
    }
    const scores = [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, limit);
    return { source: 'local', scores };
  }
}
