import { useEffect, useRef, useState, useCallback } from 'react'

// Deterministic-ish pseudo random (no Math.random dependency for SSR safety;
// seeded by a mutable counter so each tick differs).
function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const ROUND_SECONDS = 10 * 60 // 10-minute rounds, like the reference
const ETH_USD = 3200

function shortAddr(rng) {
  const hex = '0123456789abcdef'
  let a = ''
  let b = ''
  for (let i = 0; i < 4; i++) a += hex[Math.floor(rng() * 16)]
  for (let i = 0; i < 4; i++) b += hex[Math.floor(rng() * 16)]
  return `0x${a}…${b}`
}

const SEED_WINNERS = [
  { addr: '0x9a3f…20e1', round: 41, prize: 3.81, ago: '5m' },
  { addr: '0x4c11…8fa2', round: 40, prize: 2.44, ago: '10m' },
  { addr: '0xe07b…1d90', round: 39, prize: 5.12, ago: '15m' },
  { addr: '0x2af9…77c4', round: 38, prize: 1.9, ago: '20m' },
]

/**
 * Simulates the on-chain lottery loop:
 * - pot fills from a simulated trade tax every tick
 * - a live countdown runs down each round
 * - when the clock hits zero, a random buyer "robs" the pot; it resets to seed
 * - stats (players, rounds, distributed) accumulate
 *
 * In production these values would come from an RPC (see rpc config) reading
 * the token contract's tax pot + round state. The shape stays identical.
 */
export function useRound() {
  const rngRef = useRef(makeRng(1337))
  const [state, setState] = useState({
    round: 42,
    pot: 4.2069,
    seed: 1.0503,
    players: 23,
    secondsLeft: 8 * 60 + 32, // 08:32, matching the reference snapshot
    distributed: 128.47,
    totalRounds: 42,
    winners: SEED_WINNERS,
    flashWin: null, // last payout, for the "robbed!" flash
  })

  const tick = useCallback(() => {
    setState((s) => {
      const rng = rngRef.current
      // simulated trade tax feeding the pot (8% pot / 2% seed)
      const traded = rng() * 0.06
      let pot = s.pot + traded * 0.8
      let seed = s.seed + traded * 0.2
      let players = s.players
      if (rng() > 0.86) players += 1

      let secondsLeft = s.secondsLeft - 1

      if (secondsLeft <= 0) {
        // Robbery! a random buyer wins the whole pot.
        const prize = +pot.toFixed(2)
        const winner = {
          addr: shortAddr(rng),
          round: s.round,
          prize,
          ago: 'now',
        }
        const winners = [winner, ...s.winners].slice(0, 6).map((w, i) =>
          i === 0 ? w : { ...w, ago: bumpAgo(w.ago) },
        )
        return {
          ...s,
          round: s.round + 1,
          totalRounds: s.totalRounds + 1,
          distributed: +(s.distributed + prize).toFixed(2),
          pot: +seed.toFixed(4),
          seed: +(0.6 + rng() * 0.6).toFixed(4),
          players: 1 + Math.floor(rng() * 6),
          secondsLeft: ROUND_SECONDS,
          winners,
          flashWin: { ...winner, id: s.round },
        }
      }

      return {
        ...s,
        pot: +pot.toFixed(4),
        seed: +seed.toFixed(4),
        players,
        secondsLeft,
        flashWin: null,
      }
    })
  }, [])

  useEffect(() => {
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tick])

  // Manual buy — adds to the pot + a player + grants a ticket for this wallet.
  const buy = useCallback((eth) => {
    setState((s) => ({
      ...s,
      pot: +(s.pot + eth * 0.8).toFixed(4),
      seed: +(s.seed + eth * 0.2).toFixed(4),
      players: s.players + 1,
    }))
  }, [])

  return { ...state, ethUsd: ETH_USD, buy, roundSeconds: ROUND_SECONDS }
}

function bumpAgo(ago) {
  if (ago === 'now') return '5m'
  const n = parseInt(ago, 10)
  if (Number.isNaN(n)) return ago
  return `${n + 5}m`
}

export function fmtClock(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
