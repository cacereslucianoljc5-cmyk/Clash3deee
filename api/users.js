// Vercel serverless function: /api/users
//
// GET  ?wallet=<address>              -> { user: {...} } | 404
// POST body { wallet, name? }         -> { user: {...} }   (create / refresh)
//
// A user is created (upserted) the moment a Solana wallet connects, keyed by
// its address. Aggregate stats (games_played, best_score) are maintained here
// and on every score submission (see api/leaderboard-core.js).
//
// Deploy this project to Vercel (or any Node serverless host) and set the
// DATABASE_URL environment variable to your Neon connection string.

import { handleUsers } from './leaderboard-core.js';

export default async function handler(req, res) {
  // Body may arrive parsed (Vercel) or as a raw string.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (_) {
      body = {};
    }
  }

  const { status, json } = await handleUsers({
    method: req.method,
    query: req.query || {},
    body,
  });

  res.status(status).json(json);
}
