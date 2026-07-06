// Vercel serverless function: /api/leaderboard
//
// GET  -> { scores: [...] }
// POST -> body { name, score, wallet?, signature? } -> { ok: true }
//
// Deploy this project to Vercel (or any Node serverless host) and set the
// DATABASE_URL environment variable to your Neon connection string.

import { handleLeaderboard } from './leaderboard-core.js';
import { applyCors } from './_cors.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return; // handled OPTIONS preflight

  // Body may arrive parsed (Vercel) or as a raw string.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (_) {
      body = {};
    }
  }

  const { status, json } = await handleLeaderboard({
    method: req.method,
    query: req.query || {},
    body,
  });

  res.status(status).json(json);
}
