type SlateTextNode = { text?: unknown };
type SlateElementNode = { children?: unknown };

function visit(node: unknown, out: string[]): void {
  if (!node) return;

  const text = (node as SlateTextNode).text;
  if (typeof text === 'string') {
    out.push(text);
    return;
  }

  const children = (node as SlateElementNode).children;
  if (Array.isArray(children)) {
    for (const child of children) visit(child, out);
    out.push('\n');
  }
}

export function slateToPlainText(value: unknown): string {
  const out: string[] = [];
  if (Array.isArray(value)) {
    for (const n of value) visit(n, out);
  } else {
    visit(value, out);
  }
  return out.join('').replace(/\n{3,}/g, '\n\n').trim();
}
