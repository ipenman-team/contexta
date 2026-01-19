import { apiClient } from "../client";

export type CreateImportResult = { ok: true; taskId: string };

export const importsApi = {
  async createMarkdown(
    args: {
      file: File;
      title?: string;
      parentIds?: string[];
    },
    options?: {
      signal?: AbortSignal;
      onUploadProgress?: (progress: number) => void;
    },
  ) {
    const form = new FormData();
    form.append("format", "markdown");
    if (args.title) form.append("title", args.title);
    if (args.parentIds?.length) {
      for (const id of args.parentIds) form.append("parentIds", id);
    }
    form.append("file", args.file, args.file.name);

    const res = await apiClient.post<CreateImportResult>("/imports", form, {
      signal: options?.signal,
      onUploadProgress: (e) => {
        const total = e.total ?? 0;
        if (!total) return;
        const ratio = e.loaded / total;
        const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        options?.onUploadProgress?.(pct);
      },
    });

    return res.data;
  },
  async createPdf(
    args: {
      file: File;
      title?: string;
      parentIds?: string[];
    },
    options?: {
      signal?: AbortSignal;
      onUploadProgress?: (progress: number) => void;
    },
  ) {
    const form = new FormData();
    form.append("format", "pdf");
    if (args.title) form.append("title", args.title);
    if (args.parentIds?.length) {
      for (const id of args.parentIds) form.append("parentIds", id);
    }
    form.append("file", args.file, args.file.name);

    const res = await apiClient.post<CreateImportResult>("/imports", form, {
      signal: options?.signal,
      onUploadProgress: (e) => {
        const total = e.total ?? 0;
        if (!total) return;
        const ratio = e.loaded / total;
        const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
        options?.onUploadProgress?.(pct);
      },
    });

    return res.data;
  },
};
