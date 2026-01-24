import { apiClient } from './client';
import type { SpaceDto } from '@/lib/api/spaces/types';

export const spacesApi = {
  async list(params?: { q?: string; skip?: number; take?: number; includeArchived?: boolean }) {
    const res = await apiClient.get<{ items: SpaceDto[]; total: number }>('/spaces', { params });
    return res.data;
  },

  async get(id: string) {
    const res = await apiClient.get<SpaceDto>(`/spaces/${encodeURIComponent(id)}`);
    return res.data;
  },

  async create(input: unknown) {
    const res = await apiClient.post('/spaces', input);
    // server returns { ok: true, space }
    const data = res.data as any;
    if (data && data.space) return data.space as SpaceDto;
    return data as SpaceDto;
  },
};

export type { SpaceDto };
