// Tiny helpers shared by the Vercel serverless handlers so body parsing and
// error handling stay consistent.

export function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (_) {
      body = {};
    }
  }
  return body || {};
}

export async function send(res, promise) {
  try {
    const json = await promise;
    res.status(200).json(json);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
}
