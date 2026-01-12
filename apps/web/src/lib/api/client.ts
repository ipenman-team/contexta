import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  readonly status?: number;
  readonly payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
  return (base && base.trim().length > 0 ? base : 'http://localhost:3001').replace(/\/$/, '');
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'x-user-id': (process.env.NEXT_PUBLIC_USER_ID ?? 'demo').toString(),
  },
});

function hasMessage(x: unknown): x is { message: unknown } {
  return typeof x === 'object' && x !== null && 'message' in x;
}

apiClient.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError: AxiosError = error;
      const status = axiosError.response?.status;
      const payload = axiosError.response?.data;
      const message =
        hasMessage(payload)
          ? String(payload.message)
          : axiosError.message;
      throw new ApiError(message, status, payload);
    }

    throw error;
  },
);
