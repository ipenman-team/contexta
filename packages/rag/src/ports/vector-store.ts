export type VectorStoreChunk = {
  id: string; // stable id (e.g. sourceId#chunkIndex)
  tenantId: string;
  sourceId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
};

export type VectorSearchFilter = {
  tenantId: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
};

export type VectorSearchResult = {
  id: string;
  score: number; // higher is better
  content: string;
  sourceId: string;
  chunkIndex: number;
  metadata?: Record<string, unknown>;
};

export interface VectorStore {
  vectorDim: number;
  upsert(chunks: VectorStoreChunk[]): Promise<{ upserted: number }>;
  deleteBySource(input: { tenantId: string; sourceId: string }): Promise<{ deleted: number }>;
  similaritySearch(
    queryEmbedding: number[],
    input: { topK: number; filter: VectorSearchFilter },
  ): Promise<VectorSearchResult[]>;
}
