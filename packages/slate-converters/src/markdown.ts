import type { SlateElement, SlateNode, SlateText, SlateValue } from './types';

type Marks = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

function normalizeMarkdown(input: string): string {
  return (input ?? '').replace(/\r\n/g, '\n');
}

function ensureParagraph(children: SlateText[]): { type: 'paragraph'; children: SlateText[] } {
  return {
    type: 'paragraph',
    children: children.length ? children : [{ text: '' }],
  };
}

function applyMark(text: string, marks: Marks): SlateText[] {
  if (!text) return [{ text: '', ...marks }];
  return [{ text, ...marks }];
}

function unescapeBackslashEscapes(input: string): string {
  const text = String(input ?? '');
  if (!text) return '';

  const out: string[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i] ?? '';
    const isSlash = ch === '\\' || ch === '＼';

    if (!isSlash) {
      out.push(ch);
      continue;
    }

    if (i + 1 >= text.length) {
      continue;
    }

    const next = text[i + 1] ?? '';
    const isNextSlash = next === '\\' || next === '＼';

    if (isNextSlash) {
      const third = i + 2 < text.length ? (text[i + 2] ?? '') : '';
      if (third && /[^a-zA-Z0-9\s]/.test(third)) {
        out.push(third);
        i += 2;
        continue;
      }

      out.push('\\');
      i += 1;
      continue;
    }

    if (/[^a-zA-Z0-9\s]/.test(next)) {
      out.push(next);
      i += 1;
      continue;
    }
  }

  return out.join('');
}

function convertInlineText(input: string, marks: Marks = {}): SlateText[] {
  const text = String(input ?? '');
  if (!text) return [{ text: '' }];

  const out: SlateText[] = [];

  const pushText = (chunk: string, nextMarks: Marks, opts?: { unescape?: boolean }) => {
    if (!chunk) return;
    const normalized = opts?.unescape === false ? chunk : unescapeBackslashEscapes(chunk);
    if (normalized) out.push(...applyMark(normalized, nextMarks));
  };

  const findNextToken = (from: number): number => {
    let next = -1;
    const candidates = ['<u>', '<ins>', '**', '__', '*', '_', '`'] as const;
    for (const token of candidates) {
      const idx = text.indexOf(token, from);
      if (idx === -1) continue;
      if (next === -1 || idx < next) next = idx;
    }
    return next;
  };

  let i = 0;
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      const nextChar = text[i + 1] ?? '';
      if (nextChar === '\\' || (/[^a-zA-Z0-9\s]/.test(nextChar) && nextChar !== '')) {
        pushText(nextChar, marks, { unescape: false });
        i += 2;
        continue;
      }
    }

    const uOpen = text.slice(i).match(/^<(u|ins)>/i);
    if (uOpen) {
      const tag = uOpen[1];
      const start = i + uOpen[0].length;
      const closeTag = `</${tag}>`;
      const rest = text.slice(start);
      const closeIndex = rest.toLowerCase().indexOf(closeTag.toLowerCase());
      if (closeIndex >= 0) {
        const inner = rest.slice(0, closeIndex);
        out.push(...convertInlineText(inner, { ...marks, underline: true }));
        i = start + closeIndex + closeTag.length;
        continue;
      }
      pushText(text[i] ?? '', marks);
      i += 1;
      continue;
    }

    const tokenSpecs: Array<{ open: string; close: string; next: Marks }> = [
      { open: '**', close: '**', next: { ...marks, bold: true } },
      { open: '__', close: '__', next: { ...marks, bold: true } },
      { open: '*', close: '*', next: { ...marks, italic: true } },
      { open: '_', close: '_', next: { ...marks, italic: true } },
      { open: '`', close: '`', next: { ...marks } },
    ];

    let matched = false;
    for (const spec of tokenSpecs) {
      if (!text.startsWith(spec.open, i)) continue;
      const start = i + spec.open.length;
      const end = text.indexOf(spec.close, start);
      if (end === -1) {
        pushText(spec.open, marks, { unescape: false });
        i = start;
        matched = true;
        break;
      }

      const inner = text.slice(start, end);
      if (spec.open === '`') {
        pushText(inner, spec.next, { unescape: false });
      } else {
        out.push(...convertInlineText(inner, spec.next));
      }

      i = end + spec.close.length;
      matched = true;
      break;
    }
    if (matched) continue;

    const nextToken = findNextToken(i);

    if (nextToken === -1) {
      pushText(text.slice(i), marks);
      break;
    }

    if (nextToken <= i) {
      pushText(text[i] ?? '', marks);
      i += 1;
      continue;
    }

    pushText(text.slice(i, nextToken), marks);
    i = nextToken;
  }

  return out.length ? out : [{ text: '' }];
}

function splitLines(input: string): string[] {
  return normalizeMarkdown(input).split('\n');
}

function parseParagraphLines(lines: string[]): SlateValue {
  const text = lines.join('\n').trimEnd();
  return [ensureParagraph(convertInlineText(text))];
}

function parseBlockquoteLines(lines: string[]): SlateValue {
  const innerText = lines
    .map((l) => l.replace(/^\s*>\s?/, ''))
    .join('\n');
  const inner = markdownToSlateValue(innerText);
  return [
    {
      type: 'block-quote',
      children: inner.length ? inner : [ensureParagraph([{ text: '' }])],
    },
  ];
}

function countIndent(input: string): number {
  const s = String(input ?? '');
  let n = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i] ?? '';
    if (ch === ' ') {
      n += 1;
      continue;
    }
    if (ch === '\t') {
      n += 4;
      continue;
    }
    break;
  }
  return n;
}

function parseListMarker(line: string):
  | {
      indent: number;
      listType: 'numbered-list' | 'bulleted-list';
      text: string;
    }
  | null {
  const s = String(line ?? '');
  const indent = countIndent(s);
  const trimmed = s.trimStart();

  const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
  if (bullet) {
    return { indent, listType: 'bulleted-list', text: String(bullet[1] ?? '') };
  }

  const ordered = trimmed.match(/^(\d+)[.)]?\s+(.*)$/);
  if (ordered && /^\d+\./.test(trimmed)) {
    return { indent, listType: 'numbered-list', text: String(ordered[2] ?? '') };
  }
  if (ordered && /^(\d+)[)]\s+/.test(trimmed)) {
    return { indent, listType: 'numbered-list', text: String(ordered[2] ?? '') };
  }

  return null;
}

function isListContinuationLine(line: string): boolean {
  const s = String(line ?? '');
  if (!s.trim()) return false;
  return /^\s{2,}\S/.test(s) || /^\t+\S/.test(s);
}

function ensureListItemText(item: { type: 'list-item'; children: SlateNode[] }, text: string, opts?: { append?: boolean }) {
  const last = item.children[item.children.length - 1];
  const normalized = String(text ?? '').trimEnd();

  if (
    opts?.append &&
    last &&
    typeof last === 'object' &&
    'type' in (last as Record<string, unknown>) &&
    (last as Record<string, unknown>).type === 'paragraph' &&
    Array.isArray((last as Record<string, unknown>).children)
  ) {
    const paragraph = last as unknown as { type: 'paragraph'; children: SlateText[] };
    paragraph.children.push({ text: '\n' });
    paragraph.children.push(...convertInlineText(normalized.trimStart()));
    return;
  }

  item.children.push(ensureParagraph(convertInlineText(normalized.trimStart())));
}

function parseListBlocks(lines: string[]): SlateValue {
  const blocks: SlateValue = [];

  type ListEntry = {
    indent: number;
    listType: 'numbered-list' | 'bulleted-list';
    listNode: SlateElement & {
      type: 'numbered-list' | 'bulleted-list';
      children: Array<SlateElement & { type: 'list-item'; children: SlateNode[] }>;
    };
    lastItem: (SlateElement & { type: 'list-item'; children: SlateNode[] }) | null;
  };

  const stack: ListEntry[] = [];
  let pendingBlank = false;

  const ensureListAt = (indent: number, listType: 'numbered-list' | 'bulleted-list'): ListEntry => {
    while (stack.length) {
      const top = stack[stack.length - 1] as ListEntry;
      if (indent < top.indent) {
        stack.pop();
        continue;
      }
      if (indent === top.indent && top.listType !== listType) {
        stack.pop();
        continue;
      }
      break;
    }

    if (!stack.length) {
      const listNode: ListEntry['listNode'] = { type: listType, children: [] };
      const entry: ListEntry = { indent, listType, listNode, lastItem: null };
      blocks.push(listNode);
      stack.push(entry);
      return entry;
    }

    const top = stack[stack.length - 1] as ListEntry;
    if (indent === top.indent && top.listType === listType) return top;

    if (indent > top.indent) {
      if (!top.lastItem) {
        const placeholder: ListEntry['lastItem'] = {
          type: 'list-item',
          children: [ensureParagraph([{ text: '' }])],
        };
        top.listNode.children.push(placeholder);
        top.lastItem = placeholder;
      }

      const parentItem = top.lastItem;
      let nested: ListEntry['listNode'] | null = null;

      for (let i = parentItem.children.length - 1; i >= 0; i -= 1) {
        const child = parentItem.children[i];
        if (
          child &&
          typeof child === 'object' &&
          'type' in (child as Record<string, unknown>) &&
          (child as Record<string, unknown>).type === listType &&
          Array.isArray((child as Record<string, unknown>).children)
        ) {
          nested = child as ListEntry['listNode'];
          break;
        }
      }

      if (!nested) {
        nested = { type: listType, children: [] };
        parentItem.children.push(nested);
      }

      const entry: ListEntry = { indent, listType, listNode: nested, lastItem: null };
      stack.push(entry);
      return entry;
    }

    const fallback = stack[stack.length - 1] as ListEntry;
    if (fallback.listType === listType) return fallback;
    return ensureListAt(indent, listType);
  };

  let idx = 0;
  while (idx < lines.length) {
    const raw = String(lines[idx] ?? '');

    if (!raw.trim()) {
      pendingBlank = true;
      idx += 1;
      continue;
    }

    const marker = parseListMarker(raw);
    if (marker) {
      const entry = ensureListAt(marker.indent, marker.listType);
      const item: ListEntry['lastItem'] = {
        type: 'list-item',
        children: [ensureParagraph(convertInlineText(String(marker.text ?? '').trimEnd()))],
      };
      entry.listNode.children.push(item);
      entry.lastItem = item;
      pendingBlank = false;
      idx += 1;
      continue;
    }

    const entry = stack[stack.length - 1];
    if (!entry) {
      blocks.push(...parseParagraphLines([raw]));
      pendingBlank = false;
      idx += 1;
      continue;
    }

    if (!entry.lastItem) {
      const placeholder: ListEntry['lastItem'] = {
        type: 'list-item',
        children: [ensureParagraph([{ text: '' }])],
      };
      entry.listNode.children.push(placeholder);
      entry.lastItem = placeholder;
    }

    const run: string[] = [];
    while (idx < lines.length) {
      const line = String(lines[idx] ?? '');
      if (!line.trim()) break;
      if (parseListMarker(line)) break;
      run.push(line);
      idx += 1;
    }

    const content = run
      .map((l) => String(l ?? '').trimEnd().trimStart())
      .join('\n')
      .trimEnd();

    ensureListItemText(entry.lastItem, content, { append: !pendingBlank });
    pendingBlank = false;
  }

  if (!blocks.length) {
    return [
      {
        type: 'bulleted-list',
        children: [{ type: 'list-item', children: [ensureParagraph([{ text: '' }])] }],
      },
    ];
  }

  return blocks;
}

export function markdownToSlateValue(markdown: string): SlateValue {
  const lines = splitLines(markdown);
  const blocks: SlateValue = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      const fence = line.trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== fence) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push(ensureParagraph([{ text: codeLines.join('\n') }]));
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      const depth = heading[1].length;
      const text = heading[2] ?? '';
      const type = depth === 1 ? 'heading-one' : 'heading-two';
      blocks.push({ type, children: convertInlineText(text.trimEnd()) });
      i += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i] ?? '')) {
        quoteLines.push(lines[i] ?? '');
        i += 1;
      }
      blocks.push(...parseBlockquoteLines(quoteLines));
      continue;
    }

    if (parseListMarker(line)) {
      const listLines: string[] = [];

      while (i < lines.length) {
        const current = lines[i] ?? '';

        if (!String(current).trim()) {
          const next = i + 1 < lines.length ? (lines[i + 1] ?? '') : '';
          if (parseListMarker(next) || isListContinuationLine(next)) {
            listLines.push(current);
            i += 1;
            continue;
          }
          break;
        }

        if (parseListMarker(current) || isListContinuationLine(current)) {
          listLines.push(current);
          i += 1;
          continue;
        }

        break;
      }

      blocks.push(...parseListBlocks(listLines));
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? '';
      if (!current.trim()) break;
      if (/^\s*```/.test(current)) break;
      if (/^\s*(#{1,6})\s+/.test(current)) break;
      if (/^\s*>/.test(current)) break;
      if (parseListMarker(current)) break;
      paraLines.push(current);
      i += 1;
    }
    blocks.push(...parseParagraphLines(paraLines));
  }

  return blocks.length ? blocks : [ensureParagraph([{ text: '' }])];
}
