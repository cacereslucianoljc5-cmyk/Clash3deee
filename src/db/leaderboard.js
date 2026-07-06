// Browser-side leaderboard client.
//
// Talks to the /api/leaderboard endpoint (Neon-backed in production). When that
// endpoint is unreachable — e.g. the site is served statically from GitHub
// Pages with no serverless host — it transparently falls back to a localStorage
// leaderboard so the game remains fully playable.

const API_URL = import.meta.env.VITE_API_URL || '/api/leaderboard';
const LS_KEY = 'siege_leaderboard_v1';

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function writeLocal(rows) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(0, 50)));
  } catch (_) {
    /* storage full / disabled */
  }
}

export async function fetchLeaderboard(limit = 20) {
  try {
    const resp = await fetch(`${API_URL}?limit=${limit}`, {
      headers: { Accept: 'application/json' },
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    return { source: 'api', scores: data.scores || [] };
  } catch (_) {
    const rows = readLocal()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { source: 'local', scores: rows };
  }
}

export async function submitScore(entry) {
  // entry: { name, score, wallet?, signature? }
  const payload = {
    name: entry.name || entry.wallet || 'anon',
    score: Math.max(0, Math.floor(entry.score || 0)),
    wallet: entry.wallet || null,
    signature: entry.signature || null,
  };

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    return { ok: true, source: 'api' };
  } catch (_) {
    const rows = readLocal();
    rows.push({ ...payload, created_at: new Date().toISOString() });
    writeLocal(rows);
    return { ok: true, source: 'local' };
  }
}
