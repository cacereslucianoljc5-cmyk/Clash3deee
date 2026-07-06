-- Búsqueda semántica con pgvector en Neon.
-- Ejecutar en Neon SQL Editor o vía psql.

CREATE EXTENSION IF NOT EXISTS vector;

-- Ajustá la dimensión al modelo de embeddings que uses
-- (1536 = text-embedding-3-small, 3072 = text-embedding-3-large, 768, etc.)
CREATE TABLE IF NOT EXISTS documents (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}'::jsonb,
  embedding  VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice ANN para escalar (HNSW + coseno, recomendado)
CREATE INDEX IF NOT EXISTS documents_embedding_hnsw
  ON documents USING hnsw (embedding vector_cosine_ops);

-- Búsqueda de los k más parecidos (parametrizar $1 = embedding de la consulta,
-- $2 = límite). Podés combinar con filtros relacionales sobre metadata:
--
-- SELECT id, content
-- FROM documents
-- WHERE metadata->>'lang' = 'es'
-- ORDER BY embedding <=> $1
-- LIMIT $2;
