-- Esquema de la base de datos Neon para la whitelist de $SIEGE.
-- Ejecutá esto UNA vez en tu proyecto Neon:
--   Neon Console → tu proyecto → SQL Editor → pegar y Run.
--
-- El backend guarda los correos ya en minúsculas, así que una restricción
-- UNIQUE sobre la columna `email` es suficiente y permite el
-- "ON CONFLICT (email) DO NOTHING" de api/whitelist.js.

CREATE TABLE IF NOT EXISTS whitelist (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
