import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only middleware that serves the /api/* endpoints using the SAME handlers
// as the Vercel serverless functions, so `npm run dev` is a fully working stack:
// Neon-backed when DATABASE_URL is set, in-memory otherwise.
function neonDevApi(env) {
  const routes = {
    '/api/user': () => import('./api/user.js'),
    '/api/leaderboard': () => import('./api/leaderboard.js'),
  }

  return {
    name: 'neon-dev-api',
    configureServer(server) {
      // Make DATABASE_URL from .env visible to the handlers (read process.env).
      if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const load = routes[url.pathname]
        if (!load) return next()

        // Read the JSON body (if any) into a string, like Vercel does.
        let bodyStr = ''
        if (req.method === 'POST' || req.method === 'PUT') {
          const chunks = []
          for await (const c of req) chunks.push(c)
          bodyStr = Buffer.concat(chunks).toString('utf8')
        }

        // Adapt Node req/res to the { req, res } shape the handlers expect.
        req.query = Object.fromEntries(url.searchParams.entries())
        req.body = bodyStr
        res.status = (code) => {
          res.statusCode = code
          return res
        }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }

        try {
          const mod = await load()
          await mod.default(req, res)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Server error' }))
        }
      })
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
