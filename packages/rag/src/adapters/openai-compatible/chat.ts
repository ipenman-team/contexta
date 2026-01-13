import type { ChatProvider, ChatMessage } from '../../ports/chat-provider';
import type { OpenAICompatibleChatConfig } from './types';
import { postJson } from './http';

type ChatCompletionsResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: unknown;
};

export class OpenAICompatibleChatProvider implements ChatProvider {
  public readonly model: string;
  private readonly url: string;
  private readonly apiKey: string;

  constructor(private readonly config: OpenAICompatibleChatConfig) {
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  }

  async generate(messages: ChatMessage[]) {
    const payload = {
      model: this.model,
      messages,
    };

    const data = await postJson<ChatCompletionsResponse>(this.url, this.apiKey, payload);
    const content = data.choices?.[0]?.message?.content ?? '';
    return { content: String(content), usage: data.usage };
  }
}
