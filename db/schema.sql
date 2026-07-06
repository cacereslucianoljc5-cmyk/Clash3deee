-- Neon (Postgres) schema for the Siege Kingdoms game.
-- Run once against your Neon database (the app also creates these tables
-- automatically on first write, so this file is mainly for reference / manual
-- setup).

-- Players, keyed by their Solana wallet address. A row is created (upserted)
-- the moment a wallet connects, and its aggregate stats are refreshed on every
-- score submission.
CREATE TABLE IF NOT EXISTS users (
  wallet       TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  games_played INTEGER NOT NULL DEFAULT 0,
  best_score   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every individual run. `wallet` references a user when the player is
-- connected (anonymous runs leave it NULL).
CREATE TABLE IF NOT EXISTS scores (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  wallet     TEXT REFERENCES users(wallet) ON DELETE SET NULL,
  score      INTEGER NOT NULL CHECK (score >= 0),
  signature  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast "top N" reads.
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC, created_at ASC);

-- Fast leaderboard-by-player reads.
CREATE INDEX IF NOT EXISTS users_best_idx ON users (best_score DESC);
