// Shared CORS helper for the serverless functions.
//
// Lets a statically-hosted frontend (e.g. GitHub Pages) talk to this API when
// it's deployed elsewhere (e.g. Vercel) via VITE_API_URL / VITE_USERS_API_URL,
// so the leaderboard can still be global. Set CORS_ORIGIN to lock this down to
// your site's origin; defaults to '*' (the API only stores public scores).

export function applyCors(req, res) {
  const origin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Short-circuit CORS preflight requests.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
