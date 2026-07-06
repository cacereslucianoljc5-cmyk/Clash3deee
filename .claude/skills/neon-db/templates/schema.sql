-- Esquema de ejemplo para Neon. Adaptalo a tu tarea.
-- Ejecutalo UNA vez en: Neon Console → tu proyecto → SQL Editor → Run.

-- Ejemplo: whitelist / lista de correos
CREATE TABLE IF NOT EXISTS whitelist (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,          -- el backend guarda en minúsculas
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ejemplo: usuarios
-- CREATE TABLE IF NOT EXISTS users (
--   id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   email       TEXT NOT NULL UNIQUE,
--   name        TEXT,
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- Ejemplo: contador de eventos
-- CREATE TABLE IF NOT EXISTS events (
--   id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   kind        TEXT NOT NULL,
--   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS events_kind_idx ON events (kind);
