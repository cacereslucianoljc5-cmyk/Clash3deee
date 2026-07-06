/**
 * Cliente frontend de Meshy AI.
 *
 * IMPORTANTE: este cliente NO habla con api.meshy.ai directamente ni conoce
 * la API key. Habla con el proxy serverless (Cloudflare Worker) que guarda
 * la key en secreto. Así la key nunca llega al navegador.
 *
 * Configura la URL del proxy con la variable de entorno de Vite:
 *   VITE_MESHY_PROXY_URL=https://meshy-proxy.tu-subdominio.workers.dev
 * (ver .env.example)
 */

const PROXY_URL = (import.meta.env?.VITE_MESHY_PROXY_URL || "").replace(/\/+$/, "");

export function isConfigured() {
  return Boolean(PROXY_URL);
}

async function req(path, options) {
  if (!PROXY_URL) {
    throw new Error(
      "VITE_MESHY_PROXY_URL no está configurada. Define la URL del Worker proxy."
    );
  }
  const res = await fetch(`${PROXY_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Error ${res.status} de Meshy`);
  }
  return data;
}

/**
 * Crea una tarea text-to-3d.
 * @param {string} prompt        Descripción del modelo.
 * @param {object} [opts]
 * @param {"preview"|"refine"} [opts.mode="preview"]
 * @param {string} [opts.artStyle="realistic"]   "realistic" | "sculpture"
 * @param {string} [opts.negativePrompt]
 * @param {string} [opts.previewTaskId]          requerido si mode="refine"
 * @returns {Promise<string>} id de la tarea creada
 */
export async function createTextTo3D(prompt, opts = {}) {
  const {
    mode = "preview",
    artStyle = "realistic",
    negativePrompt,
    previewTaskId,
  } = opts;

  const body = { mode };
  if (mode === "preview") {
    body.prompt = prompt;
    body.art_style = artStyle;
    if (negativePrompt) body.negative_prompt = negativePrompt;
  } else {
    body.preview_task_id = previewTaskId;
  }

  const data = await req("/text-to-3d", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Meshy devuelve { result: "<taskId>" }
  return data.result;
}

/** Consulta el estado de una tarea text-to-3d. */
export function getTask(id) {
  return req(`/text-to-3d/${id}`, { method: "GET" });
}

/** Créditos disponibles en la cuenta de Meshy. */
export function getBalance() {
  return req("/balance", { method: "GET" });
}

/**
 * Hace polling de una tarea hasta que termina (SUCCEEDED/FAILED).
 * @param {string} id
 * @param {(task:object)=>void} [onProgress]  callback en cada consulta
 * @param {object} [opts]
 * @param {number} [opts.intervalMs=5000]
 * @param {number} [opts.timeoutMs=600000]
 * @param {AbortSignal} [opts.signal]
 */
export async function pollTask(id, onProgress, opts = {}) {
  const { intervalMs = 5000, timeoutMs = 600000, signal } = opts;
  const start = Date.now();

  while (true) {
    if (signal?.aborted) throw new Error("Cancelado");
    const task = await getTask(id);
    onProgress?.(task);

    if (task.status === "SUCCEEDED") return task;
    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(task.task_error?.message || `La tarea terminó en ${task.status}`);
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error("Tiempo de espera agotado esperando el modelo");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
