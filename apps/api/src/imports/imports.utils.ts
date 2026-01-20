import { BadRequestException } from '@nestjs/common';
import * as path from 'node:path';

export function fileNameToTitle(originalName: string | undefined): string {
  const base = (originalName ?? '').trim();
  if (!base) return 'Untitled';

  const parsed = path.parse(base);
  return (parsed.name || base).trim() || 'Untitled';
}

export function parseParentIds(input: unknown): string[] {
  if (input == null) return [];

  if (Array.isArray(input)) {
    return input
      .map((x) => String(x).trim())
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];

    // Prefer JSON array
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parseParentIds(parsed);
      } catch {
        // fallthrough
      }
    }

    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  throw new BadRequestException('invalid parentIds');
}

export function normalizeDocxMarkdown(input: string): string {
  const normalized = String(input ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = normalized.split('\n').map((line) => {
    const match = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (!match) return line;
    const depth = match[1].length;
    const text = (match[2] ?? '').trimEnd();
    if (depth <= 1) return `# ${text}`;
    return `## ${text}`;
  });

  let out = lines.join('\n');
  out = out.replace(/!\[[^\]]*]\([^)]*\)/g, '');
  out = out.replace(/<(?!\/?(?:u|ins)\b)[^>]+>/gi, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.trim();

  return out ? `${out}\n` : '';
}
