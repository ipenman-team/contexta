-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Extend enum for RAG indexing tasks
ALTER TYPE "TaskType" ADD VALUE 'RAG_INDEX';

-- CreateTable
CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_version_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "metadata" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rag_chunks_tenant_id_idx" ON "rag_chunks"("tenant_id");

-- CreateIndex
CREATE INDEX "rag_chunks_tenant_id_page_id_idx" ON "rag_chunks"("tenant_id", "page_id");

-- CreateIndex
CREATE INDEX "rag_chunks_tenant_id_page_version_id_idx" ON "rag_chunks"("tenant_id", "page_version_id");
