-- RAG vector dimension alignment (2560)
--
-- This project uses derived embeddings stored in rag_chunks.
-- We can safely truncate and rebuild the index when changing embedding dimensions.

-- Drop existing derived chunks to avoid cast issues when altering vector dimensions.
TRUNCATE TABLE "rag_chunks";

-- Align embedding vector dimension with current embedding model.
ALTER TABLE "rag_chunks"
  ALTER COLUMN "embedding" TYPE vector(2560);

-- Vector store writes page_version_id optionally.
ALTER TABLE "rag_chunks"
  ALTER COLUMN "page_version_id" DROP NOT NULL;
