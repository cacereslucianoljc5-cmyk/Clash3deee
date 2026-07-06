import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only middleware that serves /api/leaderboard and /api/users using the SAME
// handlers as the Vercel serverless functions, so `npm run dev` is a fully
// working stack: Neon-backed when DATABASE_URL is set, in-memory otherwise.
function neonDevApi(env) {
  const endpoint = (dispatch) => async (req, res) => {
    const { handleLeaderboard, handleUsers } = await import(
      './api/leaderboard-core.js'
    )
    const handler = dispatch === 'users' ? handleUsers : handleLeaderboard
    const url = new URL(req.url, 'http://localhost')
    const query = Object.fromEntries(url.searchParams.entries())

    let body = {}
    if (req.method === 'POST') {
      const chunks = []
      for await (const c of req) chunks.push(c)
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
      } catch {
        body = {}
      }
    }

    const { status, json } = await handler({ method: req.method, query, body })
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(json))
  }

  return {
    name: 'neon-dev-api',
    configureServer(server) {
      // Make DATABASE_URL from .env visible to the handler (reads process.env).
      if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL

      server.middlewares.use('/api/leaderboard', endpoint('leaderboard'))
      server.middlewares.use('/api/users', endpoint('users'))
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // Base relativa: funciona en GitHub Pages sin depender del nombre del repo.
    base: './',
    plugins: [react(), neonDevApi(env)],
  }
})
