export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatProvider {
  model: string;
  generate(messages: ChatMessage[]): Promise<{ content: string; usage?: unknown }>;
}
