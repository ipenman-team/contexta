import { markdownToSlateValue } from '../../markdown';

describe('markdownToSlateValue nested lists', () => {
  const findChildList = (node: { children: unknown[] }, type: string) => {
    for (const child of node.children) {
      if (!child || typeof child !== 'object') continue;
      const rec = child as Record<string, unknown>;
      if (rec.type === type && Array.isArray(rec.children)) {
        return rec as unknown as { type: string; children: unknown[] };
      }
    }
    return null;
  };

  it('parses nested bulleted lists', () => {
    const md = ['- A', '  - B', '    - C', '- D', ''].join('\n');
    const value = markdownToSlateValue(md);

    const root = value[0] as unknown as { type: string; children: unknown[] };
    expect(root.type).toBe('bulleted-list');
    expect(root.children).toHaveLength(2);

    const a = root.children[0] as unknown as { type: string; children: unknown[] };
    expect(a.type).toBe('list-item');
    const aPara = a.children[0] as unknown as { type: string; children: unknown[] };
    expect(aPara.type).toBe('paragraph');
    const aText = aPara.children[0] as Record<string, unknown>;
    expect(aText.text).toBe('A');

    const nested1 = findChildList(a, 'bulleted-list');
    expect(nested1).toBeTruthy();
    expect(nested1?.children).toHaveLength(1);
    const bItem = (nested1?.children[0] ?? null) as unknown as { type: string; children: unknown[] };
    const bPara = bItem.children[0] as unknown as { type: string; children: unknown[] };
    const bText = bPara.children[0] as Record<string, unknown>;
    expect(bText.text).toBe('B');

    const nested2 = findChildList(bItem, 'bulleted-list');
    expect(nested2).toBeTruthy();
    expect(nested2?.children).toHaveLength(1);
    const cItem = (nested2?.children[0] ?? null) as unknown as { type: string; children: unknown[] };
    const cPara = cItem.children[0] as unknown as { type: string; children: unknown[] };
    const cText = cPara.children[0] as Record<string, unknown>;
    expect(cText.text).toBe('C');
  });

  it('parses nested ordered lists', () => {
    const md = ['1. A', '   1. A1', '   2. A2', '2. B', ''].join('\n');
    const value = markdownToSlateValue(md);

    const root = value[0] as unknown as { type: string; children: unknown[] };
    expect(root.type).toBe('numbered-list');
    expect(root.children).toHaveLength(2);

    const a = root.children[0] as unknown as { type: string; children: unknown[] };
    const nested = findChildList(a, 'numbered-list');
    expect(nested).toBeTruthy();
    expect(nested?.children).toHaveLength(2);
    const a1Item = (nested?.children[0] ?? null) as unknown as { children: unknown[] };
    const a1Para = a1Item.children[0] as unknown as { children: unknown[] };
    const a1Text = a1Para.children[0] as Record<string, unknown>;
    expect(a1Text.text).toBe('A1');
    const a2Item = (nested?.children[1] ?? null) as unknown as { children: unknown[] };
    const a2Para = a2Item.children[0] as unknown as { children: unknown[] };
    const a2Text = a2Para.children[0] as Record<string, unknown>;
    expect(a2Text.text).toBe('A2');
  });

  it('parses mixed list types in nesting', () => {
    const md = ['- A', '  1. A1', '  2. A2', '- B', ''].join('\n');
    const value = markdownToSlateValue(md);

    const root = value[0] as unknown as { type: string; children: unknown[] };
    expect(root.type).toBe('bulleted-list');
    const a = root.children[0] as unknown as { type: string; children: unknown[] };

    const nested = findChildList(a, 'numbered-list');
    expect(nested).toBeTruthy();
    expect(nested?.children).toHaveLength(2);
    const a1Item = (nested?.children[0] ?? null) as unknown as { children: unknown[] };
    const a1Para = a1Item.children[0] as unknown as { children: unknown[] };
    const a1Text = a1Para.children[0] as Record<string, unknown>;
    expect(a1Text.text).toBe('A1');
    const a2Item = (nested?.children[1] ?? null) as unknown as { children: unknown[] };
    const a2Para = a2Item.children[0] as unknown as { children: unknown[] };
    const a2Text = a2Para.children[0] as Record<string, unknown>;
    expect(a2Text.text).toBe('A2');
  });
});
