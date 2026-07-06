import { useCallback, useEffect, useRef, useState } from 'react';
import { SiegeRenderer } from './renderer.js';

const MAX_HP = 60; // breaches allowed before the castle falls
const MAX_ENERGY = 100;
const BLAST_COST = 26;
const ENERGY_REGEN = 34; // per second

// Encapsulates the GPU renderer lifecycle + gameplay resources (HP, energy,
// score) and exposes a small imperative API for the UI.
export function useGame(canvasRef) {
  const rendererRef = useRef(null);
  const uiRafRef = useRef(0);
  const lastTsRef = useRef(0);
  const energyRef = useRef(MAX_ENERGY);
  const phaseRef = useRef('loading');

  const [phase, setPhase] = useState('loading'); // loading | ready | playing | over | error
  const [error, setError] = useState('');
  const [hud, setHud] = useState({ score: 0, hp: MAX_HP, energy: MAX_ENERGY });
  const [finalScore, setFinalScore] = useState(0);

  const setPhaseBoth = useCallback((p) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // --- init once ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new SiegeRenderer(canvas);
    rendererRef.current = renderer;

    renderer
      .init()
      .then(() => {
        if (cancelled) return;
        setPhaseBoth('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.message === 'WEBGPU_UNAVAILABLE') {
          setError(
            'Tu navegador no soporta WebGPU. Prueba Chrome/Edge 113+ o Firefox Nightly, con aceleración por hardware activada.',
          );
        } else {
          setError(err?.message || 'No se pudo inicializar la GPU.');
        }
        setPhaseBoth('error');
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(uiRafRef.current);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [canvasRef, setPhaseBoth]);

  // --- UI loop: energy regen + HP / game-over from GPU stats --------------
  const uiTick = useCallback(
    (ts) => {
      const renderer = rendererRef.current;
      if (!renderer || phaseRef.current !== 'playing') return;

      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.1);
      lastTsRef.current = ts;

      energyRef.current = Math.min(MAX_ENERGY, energyRef.current + ENERGY_REGEN * dt);

      const breaches = renderer.stats.breaches || 0;
      const hp = Math.max(0, MAX_HP - breaches);
      const score = renderer.stats.score || 0;

      setHud({ score, hp, energy: Math.round(energyRef.current) });

      if (hp <= 0) {
        renderer.stop();
        setFinalScore(score);
        setPhaseBoth('over');
        return;
      }
      uiRafRef.current = requestAnimationFrame(uiTick);
    },
    [setPhaseBoth],
  );

  const startGame = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.reset();
    renderer.start();
    energyRef.current = MAX_ENERGY;
    lastTsRef.current = 0;
    setHud({ score: 0, hp: MAX_HP, energy: MAX_ENERGY });
    setPhaseBoth('playing');
    uiRafRef.current = requestAnimationFrame(uiTick);
  }, [setPhaseBoth, uiTick]);

  const fireAt = useCallback((clientX, clientY) => {
    const renderer = rendererRef.current;
    if (!renderer || phaseRef.current !== 'playing') return;
    if (energyRef.current < BLAST_COST) return;
    energyRef.current -= BLAST_COST;
    renderer.fireBlast(clientX, clientY);
  }, []);

  return {
    phase,
    error,
    hud,
    finalScore,
    startGame,
    fireAt,
    constants: { MAX_HP, MAX_ENERGY, BLAST_COST },
  };
}
