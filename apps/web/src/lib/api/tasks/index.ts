import { apiClient } from "../client";

export type TaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export type TaskDto = {
  id: string;
  tenantId: string;
  type: string;
  status: TaskStatus;
  progress: number;
  message?: string | null;
  payload?: unknown;
  result?: unknown;
  error?: string | null;
  cancelRequestedAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export const tasksApi = {
  async get(id: string) {
    const res = await apiClient.get<TaskDto>(`/tasks/${encodeURIComponent(id)}`);
    return res.data;
  },

  async cancel(id: string) {
    const res = await apiClient.post<{ ok: true; task: TaskDto }>(
      `/tasks/${encodeURIComponent(id)}/cancel`,
    );
    return res.data;
  },
};
