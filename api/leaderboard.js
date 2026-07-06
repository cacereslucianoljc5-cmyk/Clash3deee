// Vercel serverless function: /api/leaderboard
//
// GET  ?limit=N                                  -> { scores: [...] } (mejor por usuario)
// POST { wallet?, username?, score, signature? } -> guarda la puntuación
//
// Despliega el proyecto en Vercel y define DATABASE_URL con tu cadena de Neon.

import { getTopScores, submitScore } from './db.js';
import { parseBody, send } from './_http.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return send(res, getTopScores(req.query?.limit).then((scores) => ({ scores })));
  }
  if (req.method === 'POST') {
    return send(res, submitScore(parseBody(req)));
  }
  res.status(405).json({ error: 'Method not allowed' });
}
