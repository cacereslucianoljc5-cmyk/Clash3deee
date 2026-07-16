# ROGUE · $ROGUE — landing page

> rob the whales, feed the degens

A landing page for **ROGUE**, a 10-minute on-chain lottery: you trade, the tax
fills the pot, and every 10 minutes a random buyer robs it all. Same mechanic
and sections as the reference (robinloot.xyz), rebuilt with an original brand
and an uncommon **warm editorial** palette (ivory / clay / gold / vermilion) —
deliberately not the usual neon-on-black crypto look.

## Stack
- **Vite + React 18**
- **Tailwind CSS** (custom warm palette + type scale)
- **Framer Motion** — per-element entry animations on every section
- **Iconoir** — an uncommon icon set (mask, coins, hourglass…)
- Fonts: **Bricolage Grotesque** (display), **Instrument Serif** (accent),
  **Space Grotesk** (body), **Space Mono** (labels / addresses)

## Sections
Nav + connect wallet · Hero · **live Active Round dashboard** (pot, countdown,
seed, players) · interactive Buy panel (tax → pot, tickets) · How it works
(5 steps) · Recent winners (live) · Distributed-to-players stats · Footer.

The live values are driven by a self-contained simulation in
`src/lib/useRound.js`. To go on-chain, replace that hook with an RPC read of the
token's tax pot + round state — the data shape stays identical. Wallet connect
(`src/lib/useWallet.js`) already uses `window.ethereum` when present and falls
back to a demo address otherwise.

## Develop
```bash
npm install
npm run dev
npm run build
```
