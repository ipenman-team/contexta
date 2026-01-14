import { apiClient } from "../client";

export type RagAnswerResult = {
  answer: string;
  hit: boolean;
  meta?: unknown;
};

export async function answerRagQuestion(question: string): Promise<RagAnswerResult> {
  const q = question.trim();
  const res = await apiClient.post<RagAnswerResult>("/rag/answer", {
    question: q,
  });
  return res.data;
}
