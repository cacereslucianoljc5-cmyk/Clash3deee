/**
 * Meshy AI proxy — Cloudflare Worker
 * ==================================
 *
 * Mantiene la MESHY_API_KEY en el servidor (como *secret*) para que NUNCA
 * viaje al frontend público. El navegador habla con este Worker; el Worker
 * habla con Meshy usando la key.
 *
 * Rutas expuestas (todas relativas a la URL del Worker):
 *   POST /text-to-3d          -> crea una tarea text-to-3d (preview o refine)
 *   GET  /text-to-3d/:id      -> consulta el estado/resultado de una tarea
 *   GET  /balance             -> créditos disponibles
 *
 * Configuración:
 *   - Secret  MESHY_API_KEY   (obligatorio) -> `wrangler secret put MESHY_API_KEY`
 *   - Var     ALLOWED_ORIGIN  (opcional)    -> origen permitido para CORS.
 *                                              Ej: https://cacereslucianoljc5-cmyk.github.io
 *                                              Por defecto "*" (útil en pruebas).
 */

const MESHY_BASE = "https://api.meshy.ai/openapi";

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (!env.MESHY_API_KEY) {
      return json({ error: "MESHY_API_KEY no configurada en el Worker" }, 500, cors);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, ""); // sin barra final

    const auth = { Authorization: `Bearer ${env.MESHY_API_KEY}` };

    try {
      // --- Crear tarea text-to-3d -------------------------------------
      if (path === "/text-to-3d" && request.method === "POST") {
        const body = await request.text();
        const r = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body,
        });
        return passthrough(r, cors);
      }

      // --- Consultar tarea text-to-3d ---------------------------------
      const taskMatch = path.match(/^\/text-to-3d\/([A-Za-z0-9:_-]+)$/);
      if (taskMatch && request.method === "GET") {
        const r = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskMatch[1]}`, {
          headers: auth,
        });
        return passthrough(r, cors);
      }

      // --- Balance ----------------------------------------------------
      if (path === "/balance" && request.method === "GET") {
        const r = await fetch(`${MESHY_BASE}/v1/balance`, { headers: auth });
        return passthrough(r, cors);
      }

      return json({ error: "Ruta no encontrada" }, 404, cors);
    } catch (err) {
      return json({ error: "Fallo al contactar Meshy", detail: String(err) }, 502, cors);
    }
  },
};

// Reenvía la respuesta de Meshy tal cual, añadiendo las cabeceras CORS.
async function passthrough(res, cors) {
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
      ...cors,
    },
  });
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
