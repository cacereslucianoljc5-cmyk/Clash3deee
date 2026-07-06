-- Neon (Postgres) schema for Siege Kingdoms: users + scores.
-- Run once against your Neon database (the app also creates these tables
-- automatically on first use, so this file is mainly for reference / manual
-- setup).

-- Identity: one row per connected Solana wallet.
CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  wallet     TEXT UNIQUE NOT NULL,
  username   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every submitted game result. `wallet` is nullable to allow anonymous play.
CREATE TABLE IF NOT EXISTS scores (
  id         BIGSERIAL PRIMARY KEY,
  wallet     TEXT,
  username   TEXT NOT NULL,
  score      INTEGER NOT NULL CHECK (score >= 0),
  signature  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast "top N" reads.
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS scores_wallet_idx ON scores (wallet);
