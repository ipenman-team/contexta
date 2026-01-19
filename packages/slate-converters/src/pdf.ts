function normalizeLineForMatch(line: string): string {
  return String(line ?? '')
    .replaceAll('\u0000', '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripPaginationMarkersInLine(line: string): string {
  const s = String(line ?? '');
  if (!s) return s;

  const leading = s.match(/^\s*/)?.[0] ?? '';
  const body = s.slice(leading.length);

  const prefixRegex =
    /^(?:--\s*\d+\s*(?:of\s*\d+)?\s*--|[-—–]{1,}\s*\d+\s*(?:of\s*\d+)?\s*[-—–]{1,}|page\s*\d+\s*(?:of\s*\d+)?|第?\s*\d+\s*(?:页|page)\s*(?:\/\s*(?:共|of)?\s*\d+\s*(?:页|page))?)\s+/i;
  const inlineTestRegex =
    /(?:--\s*\d+\s*(?:of\s*\d+)?\s*--|page\s*\d+\s*(?:of\s*\d+)?|第?\s*\d+\s*(?:页|page)\s*(?:\/\s*(?:共|of)?\s*\d+\s*(?:页|page))?)/i;
  const inlineRegex =
    /\s*(?:--\s*\d+\s*(?:of\s*\d+)?\s*--|page\s*\d+\s*(?:of\s*\d+)?|第?\s*\d+\s*(?:页|page)\s*(?:\/\s*(?:共|of)?\s*\d+\s*(?:页|page))?)\s*/gi;

  const hasPrefix = prefixRegex.test(body);
  const hasInline = inlineTestRegex.test(body);
  if (!hasPrefix && !hasInline) return s;

  let rest = body;
  rest = rest.replace(prefixRegex, '');
  rest = rest.replace(inlineRegex, ' ');
  rest = rest.replace(/\s+/g, ' ').trimStart().trimEnd();
  return rest ? `${leading}${rest}` : '';
}

function isPaginationLine(line: string): boolean {
  const s = normalizeLineForMatch(line);
  if (!s) return false;
  if (/^[-—–]{1,}\s*\d+\s*(?:of\s*\d+)?\s*[-—–]{1,}$/i.test(s)) return true;
  if (/^\d+\s*\/\s*\d+\s*$/.test(s)) return true;
  if (/^page\s*\d+\s*(?:of\s*\d+)?$/i.test(s)) return true;
  if (/^第?\s*\d+\s*(?:页|page)\s*(?:\/\s*(?:共|of)?\s*\d+\s*(?:页|page))?$/i.test(s)) return true;
  if (/^\s*[-—–]{1,}\s*\d+\s*[-—–]{1,}\s*$/.test(s)) return true;
  return false;
}

function headerFooterKey(line: string): string {
  const stripped = stripPaginationMarkersInLine(line);
  const normalized = normalizeLineForMatch(stripped);
  if (!normalized) return '';
  if (normalized.length > 100) return '';
  return normalized;
}

function splitLongLine(line: string): string[] {
  const raw = String(line ?? '');
  const trimmedEnd = raw.replace(/\s+$/g, '');
  const segments = trimmedEnd.split(/\s{2,}/g).map((s) => s).filter((s) => s.trim());
  if (segments.length <= 1) return [trimmedEnd];
  if (trimmedEnd.length < 120) return [trimmedEnd];
  return segments;
}

function splitKeyValueRuns(line: string): string[] {
  const raw = String(line ?? '');
  const trimmedEnd = raw.replace(/\s+$/g, '');
  const leading = trimmedEnd.match(/^\s*/)?.[0] ?? '';
  const body = trimmedEnd.slice(leading.length);
  const bodyTrimmed = body.trim();
  if (!bodyTrimmed) return [];
  const sepMatches = [...bodyTrimmed.matchAll(/([^\s]{1,16})([：:])/g)];
  const positions: number[] = [];
  for (const m of sepMatches) {
    const key = String(m[1] ?? '');
    const sepIndex = m.index ?? -1;
    if (sepIndex < 0) continue;
    const before = bodyTrimmed[sepIndex - 1] ?? '';
    if (sepIndex !== 0 && !/\s/.test(before)) continue;
    if (!/[A-Za-z\u4E00-\u9FFF]/.test(key)) continue;
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'http' || lowerKey === 'https') continue;
    positions.push(sepIndex);
  }
  const unique = Array.from(new Set(positions)).sort((a, b) => a - b);
  if (unique.length < 2) return [trimmedEnd];

  const out: string[] = [];
  let last = 0;
  for (let i = 1; i < unique.length; i += 1) {
    const pos = unique[i] ?? 0;
    const chunk = bodyTrimmed.slice(last, pos).trim();
    if (chunk) out.push(`${leading}${chunk}`);
    last = pos;
  }
  const tail = bodyTrimmed.slice(last).trim();
  if (tail) out.push(`${leading}${tail}`);
  return out.length ? out : [trimmedEnd];
}

function normalizeListLine(line: string): string | null {
  const trimmed = line.trimStart();
  const bulletMatch = trimmed.match(/^([•·●▪◦])\s+(.*)$/);
  if (bulletMatch) {
    const rest = (bulletMatch[2] ?? '').trim();
    return `- ${rest}`.trimEnd();
  }

  const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
  if (orderedMatch) {
    const n = orderedMatch[1];
    const rest = (orderedMatch[2] ?? '').trim();
    return `${n}. ${rest}`.trimEnd();
  }

  const orderedCnMatch = trimmed.match(/^(\d+)[、）)]\s*(.*)$/);
  if (orderedCnMatch) {
    const n = orderedCnMatch[1];
    const rest = (orderedCnMatch[2] ?? '').trim();
    return `${n}. ${rest}`.trimEnd();
  }

  const orderedCnNumMatch = trimmed.match(/^([一二三四五六七八九十]+)[、）)]\s*(.*)$/);
  if (orderedCnNumMatch) {
    const cn = orderedCnNumMatch[1] ?? '';
    const rest = (orderedCnNumMatch[2] ?? '').trim();
    const cnToInt = (input: string): number | null => {
      const s = input.trim();
      if (!s) return null;
      const digits: Record<string, number> = {
        一: 1,
        二: 2,
        三: 3,
        四: 4,
        五: 5,
        六: 6,
        七: 7,
        八: 8,
        九: 9,
      };
      if (s === '十') return 10;
      if (s.length === 1 && s in digits) return digits[s];
      const idx = s.indexOf('十');
      if (idx === -1) return null;
      const tensPart = s.slice(0, idx);
      const onesPart = s.slice(idx + 1);
      const tens = tensPart ? digits[tensPart] ?? null : 1;
      if (tens == null) return null;
      const ones = onesPart ? digits[onesPart] ?? null : 0;
      if (ones == null) return null;
      return tens * 10 + ones;
    };

    const n = cnToInt(cn);
    if (n == null) return null;
    return `${n}. ${rest}`.trimEnd();
  }

  const mdBullet = trimmed.match(/^[-*+]\s+(.*)$/);
  if (mdBullet) return `- ${(mdBullet[1] ?? '').trim()}`.trimEnd();

  const mdOrdered = trimmed.match(/^(\d+)\.\s+(.*)$/);
  if (mdOrdered) return `${mdOrdered[1]}. ${(mdOrdered[2] ?? '').trim()}`.trimEnd();

  return null;
}

function parseKeyValueLine(line: string): { key: string; sep: string; value: string } | null {
  const s = String(line ?? '');
  const idx = s.indexOf('：');
  const asciiIdx = idx === -1 ? s.indexOf(':') : -1;
  const pos = idx >= 0 ? idx : asciiIdx;
  const sep = idx >= 0 ? '：' : asciiIdx >= 0 ? ':' : '';
  if (pos <= 0) return null;

  const key = s.slice(0, pos).trim();
  const value = s.slice(pos + 1).trim();
  if (!key || !value) return null;
  if (key.length > 16) return null;
  if (/\s/.test(key)) return null;
  return { key, sep, value };
}

function isSectionHeadingLine(line: string): boolean {
  const s = normalizeLineForMatch(line);
  if (!s) return false;
  if (s.length < 4 || s.length > 26) return false;
  if (/[：:]/.test(s)) return false;
  if (/\d/.test(s) && s.length > 12) return false;
  if (/https?:\/\//i.test(s)) return false;
  if (/^[-*+]\s+/.test(s)) return false;
  if (/^\d+\.\s+/.test(s)) return false;
  if (/[，,。.!?？！（）()]/.test(s)) return false;
  return true;
}

function endsSentence(line: string): boolean {
  const s = String(line ?? '').trimEnd();
  if (!s) return false;
  return /[。！？!?；;：:]$/.test(s);
}

function shouldJoinParagraphLine(prev: string, next: string): boolean {
  const a = String(prev ?? '').trim();
  const b = String(next ?? '').trim();
  if (!a || !b) return false;
  if (endsSentence(a)) return false;
  if (/[：:]/.test(a) || /[：:]/.test(b)) return false;
  if (a.length < 20) return false;
  if (b.length < 10) return false;
  if (/^[-*+]\s+/.test(b) || /^\d+\.\s+/.test(b)) return false;
  if (/^>/.test(b)) return false;
  return true;
}

export function pdfPagesToMarkdown(pages: string[]): string {
  const normalizedPages = (pages ?? []).map((p) =>
    String(p ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\f/g, '\n')
      .replaceAll('\u0000', '')
      .replaceAll('\t', '    '),
  );

  const pageLines = normalizedPages.map((pageText) => {
    const rawLines = pageText.split('\n');
    const out: string[] = [];
    for (const rawLine of rawLines) {
      const trimmedEnd = rawLine.replace(/\s+$/g, '');
      const cleaned = stripPaginationMarkersInLine(trimmedEnd);
      if (!cleaned.trim()) {
        out.push('');
        continue;
      }
      const kvSplits = splitKeyValueRuns(cleaned);
      for (const kv of kvSplits) {
        const split = splitLongLine(kv);
        for (const seg of split) out.push(seg);
      }
    }
    return out;
  });

  const pageCount = pageLines.length;
  const threshold = Math.max(2, Math.ceil(pageCount * 0.6));
  const headerFooterFreq = new Map<string, number>();

  for (const lines of pageLines) {
    const nonEmpty = lines.filter((l) => headerFooterKey(l));
    const header = nonEmpty.slice(0, 3);
    const footer = nonEmpty.slice(Math.max(0, nonEmpty.length - 3));
    const unique = new Set([...header, ...footer].map((l) => headerFooterKey(l)).filter(Boolean));
    for (const key of unique) {
      headerFooterFreq.set(key, (headerFooterFreq.get(key) ?? 0) + 1);
    }
  }

  const headerFooterSet = new Set<string>();
  for (const [key, count] of headerFooterFreq.entries()) {
    if (count >= threshold && key.length >= 3) headerFooterSet.add(key);
  }

  const filteredPages = pageLines.map((lines) => {
    const nonEmptyIndexes = lines
      .map((l, idx) => ({ l, idx, n: headerFooterKey(l) }))
      .filter((x) => x.n);
    const headerIdx = new Set(nonEmptyIndexes.slice(0, 5).map((x) => x.idx));
    const footerIdx = new Set(nonEmptyIndexes.slice(Math.max(0, nonEmptyIndexes.length - 5)).map((x) => x.idx));

    return lines.filter((l, idx) => {
      const n = normalizeLineForMatch(l);
      if (!n) return true;
      if (isPaginationLine(n)) return false;
      const key = headerFooterKey(l);
      if (key && headerFooterSet.has(key) && (headerIdx.has(idx) || footerIdx.has(idx))) return false;
      return true;
    });
  });

  const out: string[] = [];
  let paragraphText = '';
  let paragraphLastLine = '';
  let listActive = false;
  let quoteActive = false;

  const flushParagraph = () => {
    const joined = paragraphText.trim();
    if (joined) {
      out.push(joined);
      out.push('');
    }
    paragraphText = '';
    paragraphLastLine = '';
  };

  const endList = () => {
    if (!listActive) return;
    out.push('');
    listActive = false;
  };

  const endQuote = () => {
    if (!quoteActive) return;
    out.push('');
    quoteActive = false;
  };

  const pushBlank = () => {
    const last = out[out.length - 1] ?? '';
    if (last !== '') out.push('');
  };

  for (let p = 0; p < filteredPages.length; p += 1) {
    const lines = filteredPages[p] ?? [];

    for (let idx = 0; idx < lines.length; idx += 1) {
      const raw = lines[idx] ?? '';
      const line = raw.replace(/\s+$/g, '');
      const trimmed = stripPaginationMarkersInLine(line).trim();

      if (!trimmed) {
        if (listActive) {
          let j = idx + 1;
          while (j < lines.length) {
            const peekRaw = lines[j] ?? '';
            const peekLine = String(peekRaw).replace(/\s+$/g, '');
            const peekTrimmed = stripPaginationMarkersInLine(peekLine).trim();
            if (!peekTrimmed || isPaginationLine(peekTrimmed)) {
              j += 1;
              continue;
            }
            break;
          }

          if (j < lines.length) {
            const peekRaw = lines[j] ?? '';
            const peekLine = String(peekRaw).replace(/\s+$/g, '');
            const peekTrimmed = stripPaginationMarkersInLine(peekLine).trim();
            if (peekTrimmed && !isPaginationLine(peekTrimmed) && normalizeListLine(peekLine)) continue;
          }
        }

        flushParagraph();
        endList();
        endQuote();
        pushBlank();
        continue;
      }

      if (isPaginationLine(trimmed)) {
        flushParagraph();
        endList();
        endQuote();
        pushBlank();
        continue;
      }

      const listLine = normalizeListLine(line);
      if (listLine) {
        flushParagraph();
        endQuote();
        listActive = true;
        out.push(listLine);
        continue;
      }

      const isIndented = /^\s{4,}\S/.test(line);
      if (isIndented) {
        flushParagraph();
        endList();
        quoteActive = true;
        out.push(`> ${line.trimStart()}`);
        continue;
      }

      const kv = parseKeyValueLine(trimmed);
      if (kv) {
        flushParagraph();
        endList();
        endQuote();
        out.push(`**${kv.key}${kv.sep}** ${kv.value}`);
        out.push('');
        continue;
      }

      if (isSectionHeadingLine(trimmed)) {
        flushParagraph();
        endList();
        endQuote();
        out.push(`## ${trimmed}`);
        out.push('');
        continue;
      }

      if (listActive) endList();
      if (quoteActive) endQuote();

      if (!paragraphText) {
        paragraphText = trimmed;
        paragraphLastLine = trimmed;
        continue;
      }

      if (shouldJoinParagraphLine(paragraphLastLine, trimmed)) {
        paragraphText = `${paragraphText} ${trimmed}`;
        paragraphLastLine = trimmed;
        continue;
      }

      flushParagraph();
      paragraphText = trimmed;
      paragraphLastLine = trimmed;
    }

    flushParagraph();
    endList();
    endQuote();

    if (p < filteredPages.length - 1) pushBlank();
  }

  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out.join('\n').trim();
}

