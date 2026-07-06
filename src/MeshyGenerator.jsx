import React, { useEffect, useRef, useState } from "react";
import { createTextTo3D, pollTask, isConfigured } from "./lib/meshy.js";

/* Carga perezosa del web component <model-viewer> desde CDN. */
function useModelViewer() {
  const [ready, setReady] = useState(
    typeof window !== "undefined" && window.customElements?.get("model-viewer")
  );
  useEffect(() => {
    if (ready) return;
    if (document.querySelector('script[data-model-viewer]')) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    s.setAttribute("data-model-viewer", "");
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, [ready]);
  return ready;
}

const ART_STYLES = [
  { value: "realistic", label: "Realista" },
  { value: "sculpture", label: "Escultura" },
];

export default function MeshyGenerator() {
  const configured = isConfigured();
  const mvReady = useModelViewer();

  const [prompt, setPrompt] = useState(
    "un caballero medieval con armadura de asedio, estilo fantasía"
  );
  const [artStyle, setArtStyle] = useState("realistic");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [model, setModel] = useState(null); // task SUCCEEDED
  const abortRef = useRef(null);

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setModel(null);
    setProgress(0);
    setBusy(true);
    setStatus("Creando tarea…");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const id = await createTextTo3D(prompt, { mode: "preview", artStyle });
      setStatus("En cola en Meshy…");
      const task = await pollTask(
        id,
        (t) => {
          setStatus(`Generando… (${t.status})`);
          if (typeof t.progress === "number") setProgress(t.progress);
        },
        { signal: controller.signal }
      );
      setModel(task);
      setStatus("¡Listo!");
      setProgress(100);
    } catch (err) {
      if (err.message !== "Cancelado") setError(err.message);
      setStatus("");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  const glb = model?.model_urls?.glb;

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "2rem 1.25rem",
        color: "#f4f1ea",
        fontFamily: "Manrope, system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.9rem", margin: "0 0 .25rem", fontWeight: 800 }}>
        ⚔ Meshy · Generador 3D
      </h1>
      <p style={{ opacity: 0.75, margin: "0 0 1.5rem" }}>
        Text-to-3D con Meshy AI. La API key vive en el proxy serverless, no en el
        navegador.
      </p>

      {!configured && (
        <div style={warnBox}>
          <strong>Proxy no configurado.</strong> Define{" "}
          <code>VITE_MESHY_PROXY_URL</code> con la URL del Cloudflare Worker (ver{" "}
          <code>MESHY.md</code>) y reconstruye el sitio.
        </div>
      )}

      <form onSubmit={handleGenerate}>
        <label style={label}>Descripción del modelo</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          maxLength={600}
          style={input}
          placeholder="Describe el objeto o personaje 3D…"
        />

        <label style={label}>Estilo</label>
        <select
          value={artStyle}
          onChange={(e) => setArtStyle(e.target.value)}
          style={input}
        >
          {ART_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem" }}>
          <button type="submit" disabled={busy || !configured || !prompt.trim()} style={btn}>
            {busy ? "Generando…" : "Generar modelo 3D"}
          </button>
          {busy && (
            <button type="button" onClick={handleCancel} style={btnGhost}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {(busy || status) && !error && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ opacity: 0.85, marginBottom: ".4rem" }}>{status}</div>
          <div style={progressTrack}>
            <div style={{ ...progressBar, width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <div style={errBox}>⚠ {error}</div>}

      {glb && (
        <div style={{ marginTop: "1.75rem" }}>
          {mvReady ? (
            React.createElement("model-viewer", {
              src: glb,
              alt: "Modelo generado",
              "camera-controls": true,
              "auto-rotate": true,
              "shadow-intensity": "1",
              style: {
                width: "100%",
                height: "420px",
                background: "#12100c",
                borderRadius: "14px",
              },
            })
          ) : (
            <div style={{ opacity: 0.7 }}>Cargando visor 3D…</div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", marginTop: ".9rem" }}>
            {Object.entries(model.model_urls || {})
              .filter(([, url]) => url)
              .map(([fmt, url]) => (
                <a key={fmt} href={url} target="_blank" rel="noopener noreferrer" style={dl}>
                  ⬇ {fmt.toUpperCase()}
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- estilos inline ---------- */
const label = { display: "block", fontWeight: 700, margin: "1rem 0 .35rem", fontSize: ".9rem" };
const input = {
  width: "100%",
  padding: ".7rem .8rem",
  borderRadius: "10px",
  border: "1px solid #4a4335",
  background: "#1b180f",
  color: "#f4f1ea",
  fontSize: "1rem",
  boxSizing: "border-box",
};
const btn = {
  padding: ".7rem 1.3rem",
  borderRadius: "10px",
  border: "none",
  background: "#e0a83c",
  color: "#1b180f",
  fontWeight: 800,
  cursor: "pointer",
};
const btnGhost = {
  padding: ".7rem 1.1rem",
  borderRadius: "10px",
  border: "1px solid #4a4335",
  background: "transparent",
  color: "#f4f1ea",
  cursor: "pointer",
};
const dl = {
  padding: ".45rem .8rem",
  borderRadius: "8px",
  border: "1px solid #4a4335",
  color: "#e0a83c",
  textDecoration: "none",
  fontSize: ".85rem",
  fontWeight: 700,
};
const progressTrack = { height: "8px", background: "#2a251a", borderRadius: "99px", overflow: "hidden" };
const progressBar = { height: "100%", background: "#e0a83c", transition: "width .4s ease" };
const warnBox = {
  padding: ".9rem 1rem",
  borderRadius: "10px",
  background: "#3a2a12",
  border: "1px solid #7a5a1e",
  marginBottom: "1.25rem",
  fontSize: ".9rem",
};
const errBox = {
  marginTop: "1.25rem",
  padding: ".9rem 1rem",
  borderRadius: "10px",
  background: "#3a1616",
  border: "1px solid #7a2020",
};
