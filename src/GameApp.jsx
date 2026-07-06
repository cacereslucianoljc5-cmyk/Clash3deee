import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from './game/useGame.js';
import { PARTICLE_COUNT } from './game/renderer.js';
import {
  connect as walletConnect,
  disconnect as walletDisconnect,
  getBalance,
  signMessage,
  shortAddress,
  hasWallet,
  CLUSTER,
} from './solana/wallet.js';
import { fetchLeaderboard, submitScore } from './db/leaderboard.js';

function Bar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] uppercase tracking-widest text-white/60 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-100"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function GameApp() {
  const canvasRef = useRef(null);
  const { phase, error, hud, finalScore, startGame, fireAt, constants } =
    useGame(canvasRef);

  // --- wallet state -------------------------------------------------------
  const [wallet, setWallet] = useState(null); // { provider, publicKey }
  const [balance, setBalance] = useState(null);
  const [walletErr, setWalletErr] = useState('');

  const onConnect = useCallback(async () => {
    setWalletErr('');
    try {
      const w = await walletConnect();
      setWallet(w);
      try {
        setBalance(await getBalance(w.publicKey));
      } catch (_) {
        setBalance(null);
      }
    } catch (err) {
      setWalletErr(err.message || 'No se pudo conectar la wallet.');
    }
  }, []);

  const onDisconnect = useCallback(async () => {
    await walletDisconnect();
    setWallet(null);
    setBalance(null);
  }, []);

  // --- leaderboard --------------------------------------------------------
  const [board, setBoard] = useState({ source: null, scores: [] });
  const [loadingBoard, setLoadingBoard] = useState(false);

  const refreshBoard = useCallback(async () => {
    setLoadingBoard(true);
    const res = await fetchLeaderboard(15);
    setBoard(res);
    setLoadingBoard(false);
  }, []);

  useEffect(() => {
    refreshBoard();
  }, [refreshBoard]);

  // --- score submission on game over -------------------------------------
  const [submitState, setSubmitState] = useState('idle'); // idle|sending|done
  const submittedForRef = useRef(-1);

  const submit = useCallback(async () => {
    setSubmitState('sending');
    let signature = null;
    if (wallet?.provider) {
      signature = await signMessage(
        wallet.provider,
        `Siege Kingdoms score: ${finalScore} @ ${new Date().toISOString()}`,
      );
    }
    await submitScore({
      name: wallet ? shortAddress(wallet.publicKey) : 'anon',
      score: finalScore,
      wallet: wallet?.publicKey || null,
      signature,
    });
    submittedForRef.current = finalScore;
    setSubmitState('done');
    refreshBoard();
  }, [wallet, finalScore, refreshBoard]);

  // reset submit state when a new game-over happens
  useEffect(() => {
    if (phase === 'over' && submittedForRef.current !== finalScore) {
      setSubmitState('idle');
    }
  }, [phase, finalScore]);

  const onPointerDown = useCallback(
    (e) => {
      if (phase === 'playing') fireAt(e.clientX, e.clientY);
    },
    [phase, fireAt],
  );

  const canFire = hud.energy >= constants.BLAST_COST;

  return (
    <div className="min-h-screen bg-[#05060c] text-white font-[Manrope,sans-serif] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">
              Siege Kingdoms
            </h1>
            <p className="text-[11px] text-white/50 leading-none mt-0.5">
              TypeGPU · Solana · Neon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {wallet ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="text-right leading-tight">
                <div className="font-mono text-emerald-300">
                  {shortAddress(wallet.publicKey)}
                </div>
                <div className="text-[11px] text-white/50">
                  {balance != null ? `${balance.toFixed(3)} SOL` : '—'} · {CLUSTER}
                </div>
              </div>
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:brightness-110 text-sm font-semibold"
            >
              {hasWallet() ? 'Conectar wallet' : 'Instalar Phantom'}
            </button>
          )}
        </div>
      </header>

      {walletErr && (
        <div className="px-5 py-2 text-xs text-rose-300 bg-rose-500/10">
          {walletErr}
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Game area */}
        <section className="relative flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-white/10 bg-black">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ cursor: phase === 'playing' ? 'crosshair' : 'default' }}
          />

          {/* Castle marker at the center */}
          {phase === 'playing' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-3xl drop-shadow-[0_0_12px_rgba(255,220,120,0.8)]">
                🏰
              </div>
            </div>
          )}

          {/* HUD */}
          {phase === 'playing' && (
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-4 pointer-events-none">
              <div className="w-44 space-y-2 bg-black/40 backdrop-blur rounded-xl p-3">
                <Bar label="Muralla" value={hud.hp} max={constants.MAX_HP} color="#34d399" />
                <Bar
                  label="Energía"
                  value={hud.energy}
                  max={constants.MAX_ENERGY}
                  color={canFire ? '#a78bfa' : '#f43f5e'}
                />
              </div>
              <div className="bg-black/40 backdrop-blur rounded-xl px-4 py-2 text-right">
                <div className="text-[11px] uppercase tracking-widest text-white/50">
                  Puntos
                </div>
                <div className="text-2xl font-bold tabular-nums">{hud.score}</div>
              </div>
            </div>
          )}

          {/* Overlays */}
          {phase !== 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
              <div className="max-w-md text-center">
                {phase === 'loading' && (
                  <p className="text-white/70 animate-pulse">Inicializando GPU…</p>
                )}

                {phase === 'error' && (
                  <div>
                    <div className="text-4xl mb-3">🚫</div>
                    <h2 className="text-xl font-bold mb-2">WebGPU no disponible</h2>
                    <p className="text-sm text-white/60">{error}</p>
                  </div>
                )}

                {phase === 'ready' && (
                  <div>
                    <div className="text-5xl mb-3">🏰⚔️</div>
                    <h2 className="text-2xl font-bold mb-2">Defiende el reino</h2>
                    <p className="text-sm text-white/60 mb-5">
                      {PARTICLE_COUNT.toLocaleString('es')} invasores calculados en la
                      GPU con TypeGPU avanzan hacia tu castillo. Haz clic para lanzar
                      ondas de choque y destruirlos antes de que rompan la muralla.
                    </p>
                    <button
                      onClick={startGame}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold hover:brightness-110"
                    >
                      ▶ Jugar
                    </button>
                  </div>
                )}

                {phase === 'over' && (
                  <div>
                    <div className="text-5xl mb-3">💥</div>
                    <h2 className="text-2xl font-bold mb-1">¡La muralla cayó!</h2>
                    <p className="text-sm text-white/60 mb-1">Puntuación final</p>
                    <p className="text-4xl font-black text-emerald-300 mb-5 tabular-nums">
                      {finalScore}
                    </p>

                    <div className="flex flex-col gap-2 items-center">
                      {submitState !== 'done' ? (
                        <button
                          onClick={submit}
                          disabled={submitState === 'sending'}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 font-semibold hover:brightness-110 disabled:opacity-50"
                        >
                          {submitState === 'sending'
                            ? 'Enviando…'
                            : wallet
                              ? 'Firmar y enviar puntuación'
                              : 'Enviar puntuación (anónima)'}
                        </button>
                      ) : (
                        <p className="text-sm text-emerald-300">
                          ✓ Puntuación registrada
                        </p>
                      )}
                      <button
                        onClick={startGame}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold"
                      >
                        ↻ Jugar de nuevo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar: leaderboard */}
        <aside className="lg:w-80 rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold tracking-tight">🏆 Ranking</h3>
            <button
              onClick={refreshBoard}
              className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
            >
              {loadingBoard ? '…' : '↻'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto -mr-2 pr-2">
            {board.scores.length === 0 ? (
              <p className="text-sm text-white/40 py-6 text-center">
                Aún no hay puntuaciones. ¡Sé el primero!
              </p>
            ) : (
              <ol className="space-y-1.5">
                {board.scores.map((row, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03]"
                  >
                    <span
                      className={`w-6 text-center font-bold ${
                        i === 0
                          ? 'text-yellow-300'
                          : i === 1
                            ? 'text-slate-300'
                            : i === 2
                              ? 'text-amber-600'
                              : 'text-white/40'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 font-mono text-sm truncate">
                      {row.name || 'anon'}
                    </span>
                    <span className="font-bold tabular-nums text-emerald-300">
                      {row.score}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <p className="mt-3 text-[11px] text-white/40 leading-snug">
            {board.source === 'api'
              ? 'Datos desde Neon (Postgres serverless).'
              : board.source === 'local'
                ? 'Sin backend disponible: ranking local (este navegador).'
                : ''}
          </p>
        </aside>
      </main>

      <footer className="px-5 py-3 text-center text-[11px] text-white/30 border-t border-white/10">
        Motor GPU con TypeGPU · Wallet en {CLUSTER} · Ranking en Neon · Solo demo,
        nada de esto es asesoría financiera.
      </footer>
    </div>
  );
}
