const STOPWORDS = new Set([
  '什么',
  '如何',
  '为什么',
  '怎么',
  '怎样',
  '是否',
  '可以',
  '能否',
  '请问',
  '一下',
  '介绍',
  '解释',
  '概念',
  '含义',
  '的',
  '了',
  '吗',
  '呢',
  '啊',
]);

export function extractKeywords(question: string): string[] {
  const tokens = new Set<string>();
  const lower = question.toLowerCase();

  // 精确模式：user_123
  (lower.match(/user_\d+/g) ?? []).forEach((t) => tokens.add(t));

  // 英文/数字 token
  (lower.match(/[a-z0-9_]{2,}/g) ?? []).forEach((t) => tokens.add(t));

  // 中文片段 + bigram
  const zhSeqs = question.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  for (const seq of zhSeqs) {
    if (!STOPWORDS.has(seq)) tokens.add(seq);
    if (seq.length >= 4) {
      for (let i = 0; i < seq.length - 1; i++) {
        const bi = seq.slice(i, i + 2);
        if (!STOPWORDS.has(bi)) tokens.add(bi);
      }
    }
  }

  return Array.from(tokens)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .filter((t) => !STOPWORDS.has(t));
}
