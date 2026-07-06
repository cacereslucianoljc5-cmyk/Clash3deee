#!/usr/bin/env node
/**
 * meshy.mjs — CLI sin dependencias para Meshy AI (text-to-3D).
 *
 * Requiere Node >= 18 (usa fetch global) y la variable de entorno MESHY_API_KEY.
 *
 * Uso:
 *   node meshy.mjs balance
 *   node meshy.mjs status <taskId>
 *   node meshy.mjs generate "<prompt>" [opciones]
 *
 * Opciones de generate:
 *   --art-style <realistic|sculpture>   (por defecto: realistic)
 *   --negative "<texto>"                prompt negativo
 *   --refine                            tras el preview, genera el modelo texturizado
 *   --out <dir>                         descarga el .glb (y thumbnail) a ese directorio
 *   --json                              imprime el JSON de la tarea final en stdout
 *
 * El progreso se imprime a stderr; el resultado (JSON o rutas) a stdout,
 * para que se pueda encadenar/parsear con facilidad.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "https://api.meshy.ai/openapi";

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
function log(msg) {
  console.error(msg); // progreso -> stderr
}

function requireKey() {
  const key = process.env.MESHY_API_KEY;
  if (!key) {
    fail(
      "Falta MESHY_API_KEY.\n" +
        "  export MESHY_API_KEY=msy_...   (o añádela a tu entorno/CI como secret)"
    );
  }
  return key;
}

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${requireKey()}`, ...(options.headers || {}) },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    fail(`Meshy respondió ${res.status}: ${data.message || data.error || text}`);
  }
  return data;
}

// --- parseo de flags ---------------------------------------------------------
function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--refine" || a === "--json") flags[a.slice(2)] = true;
    else if (a.startsWith("--")) flags[a.slice(2)] = args[++i];
    else positional.push(a);
  }
  return { flags, positional };
}

// --- polling -----------------------------------------------------------------
async function poll(id, labelPrefix = "") {
  const start = Date.now();
  const timeout = 15 * 60 * 1000;
  while (true) {
    const task = await api(`/v2/text-to-3d/${id}`);
    const p = typeof task.progress === "number" ? `${task.progress}%` : "";
    log(`  ${labelPrefix}${task.status} ${p}`);
    if (task.status === "SUCCEEDED") return task;
    if (["FAILED", "CANCELED", "EXPIRED"].includes(task.status)) {
      fail(`Tarea ${id} terminó en ${task.status}: ${task.task_error?.message || ""}`);
    }
    if (Date.now() - start > timeout) fail("Tiempo de espera agotado (15 min).");
    await sleep(5000);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- descarga de artefactos --------------------------------------------------
async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) fail(`No se pudo descargar ${url} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return dest;
}

async function saveArtifacts(task, outDir) {
  await mkdir(outDir, { recursive: true });
  const saved = [];
  const glb = task.model_urls?.glb;
  if (glb) saved.push(await download(glb, join(outDir, `${task.id}.glb`)));
  if (task.thumbnail_url)
    saved.push(await download(task.thumbnail_url, join(outDir, `${task.id}.png`)));
  return saved;
}

// --- comandos ----------------------------------------------------------------
async function cmdBalance() {
  const data = await api("/v1/balance");
  console.log(JSON.stringify(data, null, 2));
}

async function cmdStatus(id) {
  if (!id) fail("Uso: status <taskId>");
  const task = await api(`/v2/text-to-3d/${id}`);
  console.log(JSON.stringify(task, null, 2));
}

async function cmdGenerate(positional, flags) {
  const prompt = positional[0];
  if (!prompt) fail('Uso: generate "<prompt>" [--art-style ...] [--refine] [--out dir]');

  const artStyle = flags["art-style"] || "realistic";

  // 1) preview
  log(`▶ Creando preview: "${prompt}" (estilo: ${artStyle})`);
  const previewBody = {
    mode: "preview",
    prompt,
    art_style: artStyle,
    ...(flags.negative ? { negative_prompt: flags.negative } : {}),
  };
  const { result: previewId } = await api("/v2/text-to-3d", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(previewBody),
  });
  log(`  id preview: ${previewId}`);
  let task = await poll(previewId, "preview: ");

  // 2) refine (opcional) -> modelo texturizado
  if (flags.refine) {
    log("▶ Lanzando refine (texturizado)…");
    const { result: refineId } = await api("/v2/text-to-3d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "refine", preview_task_id: previewId }),
    });
    log(`  id refine: ${refineId}`);
    task = await poll(refineId, "refine: ");
  }

  // 3) salida
  let savedPaths = [];
  if (flags.out) {
    log(`▶ Descargando artefactos a ${flags.out}…`);
    savedPaths = await saveArtifacts(task, flags.out);
    savedPaths.forEach((p) => log(`  ✓ ${p}`));
  }

  if (flags.json || !flags.out) {
    console.log(JSON.stringify(task, null, 2));
  } else {
    // resumen legible + rutas en stdout
    console.log(savedPaths.join("\n"));
  }
}

// --- dispatch ----------------------------------------------------------------
const [, , cmd, ...rest] = process.argv;
const { flags, positional } = parseFlags(rest);

switch (cmd) {
  case "balance":
    await cmdBalance();
    break;
  case "status":
    await cmdStatus(positional[0]);
    break;
  case "generate":
    await cmdGenerate(positional, flags);
    break;
  default:
    console.error(
      "Comandos: balance | status <id> | generate \"<prompt>\" [--art-style realistic|sculpture] [--negative ...] [--refine] [--out dir] [--json]"
    );
    process.exit(cmd ? 1 : 0);
}
