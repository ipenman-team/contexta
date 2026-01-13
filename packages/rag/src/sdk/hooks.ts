export type RagHooks = {
  // 预处理：用于做轻量清洗/改写。默认不做任何事。
  prepareQuestion?: (input: { tenantId: string; question: string }) => string | Promise<string>;
  prepareIndexText?: (input: { tenantId: string; sourceId: string; text: string }) => string | Promise<string>;

  // 生命周期：用于日志/指标/Tracing。hook 抛错不会影响主流程。
  onIndexStart?: (input: { tenantId: string; sourceId: string }) => void | Promise<void>;
  onIndexEnd?: (input: { tenantId: string; sourceId: string; chunkCount: number; ms: number }) => void | Promise<void>;
  onIndexError?: (input: { tenantId: string; sourceId: string; error: unknown; ms: number }) => void | Promise<void>;

  onAnswerStart?: (input: { tenantId: string; question: string }) => void | Promise<void>;
  onAnswerEnd?: (input: { tenantId: string; question: string; hit: boolean; ms: number }) => void | Promise<void>;
  onAnswerError?: (input: { tenantId: string; question: string; error: unknown; ms: number }) => void | Promise<void>;
};
