# IA / búsqueda vectorial en Neon (`pgvector`)

Neon es Postgres normal, así que sirve como **base vectorial** para RAG,
búsqueda semántica y memoria de agentes usando la extensión **pgvector**.
Disponible en todos los planes, sin add-on. Se instala por base de datos.

## Habilitar
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Modelar embeddings
El tipo `vector(n)` guarda un embedding de `n` dimensiones (n = tamaño del modelo,
p.ej. 1536 para `text-embedding-3-small`, 768, 3072, etc.).
```sql
CREATE TABLE documents (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content   TEXT NOT NULL,
  embedding VECTOR(1536)
);
```

## Operadores de distancia
- `<->` distancia L2 (euclidiana)
- `<#>` producto interno negativo
- `<=>` distancia coseno (la más usada con embeddings normalizados)

## Insertar y buscar (k-NN)
```sql
-- insertar (el embedding lo generás con tu modelo y lo pasás como parámetro)
INSERT INTO documents (content, embedding) VALUES ($1, $2);

-- los 5 documentos más parecidos a un vector de consulta
SELECT id, content
FROM documents
ORDER BY embedding <=> $1        -- $1 = embedding de la consulta
LIMIT 5;
```

Desde el driver:
```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
// pgvector acepta el literal '[0.1,0.2,...]'
const vec = `[${queryEmbedding.join(',')}]`;
const hits = await sql`
  SELECT id, content
  FROM documents
  ORDER BY embedding <=> ${vec}
  LIMIT 5`;
```

## Índices ANN (para escalar)
Sin índice, la búsqueda es exacta pero O(n). Para muchos vectores, creá un índice
aproximado:
```sql
-- HNSW: mejor recall/latencia, más memoria (recomendado por defecto)
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- IVFFlat: más liviano, requiere elegir 'lists' y tener datos ya cargados
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```
Usá `vector_cosine_ops`, `vector_l2_ops` o `vector_ip_ops` según el operador que
consultes.

## Consejos
- Normalizá los embeddings y usá coseno (`<=>`) para consistencia.
- Guardá metadatos junto al vector y filtralos con `WHERE` (Postgres combina
  filtros relacionales + vectoriales, ventaja sobre bases vectoriales puras).
- Para datasets enormes o híbrido full-text, mirá extensiones como `pg_search`/
  `pg_trgm` (`references/extensions.md`).
- **Branching** te deja probar reindexados/modelos nuevos en una rama sin tocar
  producción (`references/branching.md`).
- Plantilla completa en `templates/vector-search.sql`.
