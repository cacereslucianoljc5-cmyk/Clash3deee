-- Neon (Postgres) schema for the Siege Kingdoms leaderboard.
-- Run once against your Neon database (the app also creates this table
-- automatically on first write, so this file is mainly for reference / manual
-- setup).

CREATE TABLE IF NOT EXISTS scores (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  wallet     TEXT,
  score      INTEGER NOT NULL CHECK (score >= 0),
  signature  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast "top N" reads.
CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC, created_at ASC);
