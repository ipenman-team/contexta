import type { EmbeddingProvider } from '../../ports/embedding-provider';
import type { OpenAICompatibleEmbeddingConfig } from './types';
import { postJson } from './http';

type EmbeddingsResponse = {
  data?: Array<{ embedding?: number[] }>;
};

export class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {
  public readonly model: string;
  private readonly url: string;
  private readonly apiKey: string;

  constructor(private readonly config: OpenAICompatibleEmbeddingConfig) {
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.url = `${config.baseUrl.replace(/\/$/, '')}/embeddings`;
  }

  private async embedMany(texts: string[]): Promise<number[][]> {
    const payload = {
      model: this.model,
      input: texts,
    };

    const data = await postJson<EmbeddingsResponse>(this.url, this.apiKey, payload);
    const arr = data.data ?? [];
    return arr.map((x) => x.embedding ?? []);
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vec] = await this.embedMany([text]);
    return vec ?? [];
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.embedMany(texts);
  }
}
