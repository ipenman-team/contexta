export type OpenAICompatibleBaseConfig = {
  apiKey: string;
  baseUrl: string; // e.g. https://ark.cn-beijing.volces.com/api/v3
};

export type OpenAICompatibleChatConfig = OpenAICompatibleBaseConfig & {
  model: string;
};

export type OpenAICompatibleEmbeddingConfig = OpenAICompatibleBaseConfig & {
  model: string;
};
