// Vercel serverless function: /api/user
//
// GET  ?wallet=<addr>                       -> perfil del usuario (o null)
// POST { wallet, username?, signature? }    -> crea/actualiza el usuario (upsert
//                                              al conectar la wallet) y devuelve
//                                              su perfil
//
// La identidad es la dirección de wallet de Solana.

import { upsertUser, getProfile, setUsername } from './db.js';
import { parseBody, send } from './_http.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const wallet = req.query?.wallet;
    return send(res, getProfile(wallet));
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
    // `action: "rename"` cambia solo el nombre; por defecto es upsert de login.
    if (body.action === 'rename') {
      return send(res, setUsername({ wallet: body.wallet, username: body.username }));
    }
    return send(res, upsertUser({ wallet: body.wallet, username: body.username }));
  }

  res.status(405).json({ error: 'Method not allowed' });
}
