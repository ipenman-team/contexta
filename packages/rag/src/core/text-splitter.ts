export type TextSplitterConfig = {
  chunkSize: number;
  chunkOverlap: number;
};

export type TextChunk = { chunkIndex: number; content: string };

export function splitText(text: string, config: TextSplitterConfig): TextChunk[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const size = Math.max(1, Math.trunc(config.chunkSize));
  const overlap = Math.max(0, Math.trunc(config.chunkOverlap));
  const step = Math.max(1, size - overlap);

  const chunks: TextChunk[] = [];
  for (let start = 0, idx = 0; start < normalized.length; start += step, idx++) {
    const slice = normalized.slice(start, start + size);
    if (!slice.trim()) continue;
    chunks.push({ chunkIndex: idx, content: slice.trim() });
  }

  return chunks;
}
