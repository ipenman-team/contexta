import { markdownToSlateValue } from '../../markdown';
import { pdfPagesToMarkdown } from '../../pdf';
import { slateToPlainText } from '../../plain-text';

describe('pdfPagesToMarkdown', () => {
  it('removes pagination lines', () => {
    const md = pdfPagesToMarkdown(['-- 1 of 6 --\nHello\n-- 2 of 6 --\nWorld']);
    expect(md).toContain('Hello');
    expect(md).toContain('World');
    expect(md).not.toContain('of 6');
  });

  it('strips pagination prefix when mixed with content', () => {
    const md = pdfPagesToMarkdown(['— 1 — `https://cx.cnki.net` 知网个人AIGC检测服务']);
    expect(md).toContain('知网个人AIGC检测服务');
    expect(md).not.toContain('— 1 —');
  });

  it('removes repeating header/footer lines even with varying page numbers', () => {
    const md = pdfPagesToMarkdown(['— 1 — HEADER\nBody1\nFooter', '— 2 — HEADER\nBody2\nFooter']);
    expect(md).toContain('Body1');
    expect(md).toContain('Body2');
    expect(md).not.toContain('HEADER');
    expect(md).not.toContain('Footer');
  });

  it('formats key-value lines with bold key', () => {
    const md = pdfPagesToMarkdown(['检测时间：2025-07-22 22:34:30']);
    const value = markdownToSlateValue(md);
    const plain = slateToPlainText(value);
    expect(plain).toContain('检测时间：');
    expect(plain).toContain('2025-07-22 22:34:30');
  });

  it('splits multiple key-value runs into separate lines', () => {
    const md = pdfPagesToMarkdown([
      '检测时间：2025-07-22 22:34:30 篇名： 国有企业财务管理转型中的业财融合实践 作者： 史伟超',
    ]);
    expect(md).toContain('**检测时间：**');
    expect(md).toContain('**篇名：**');
    expect(md).toContain('**作者：**');
  });

  it('normalizes chinese ordered list markers', () => {
    const md = pdfPagesToMarkdown(['1、 第一项\n一、 第二项']);
    expect(md).toContain('1. 第一项');
    expect(md).toContain('1. 第二项');
  });

  it('keeps ordered list items contiguous across blank lines', () => {
    const md = pdfPagesToMarkdown(['1. Abc\n\n2. 123\n\n3. Fjksdl\n\n4. fjdksf']);
    expect(md).toContain('1. Abc\n2. 123\n3. Fjksdl\n4. fjdksf');
  });

  it('converts indentation to blockquote', () => {
    const md = pdfPagesToMarkdown(['    Indented line']);
    expect(md).toContain('> Indented line');
  });

  it('preserves indentation for nested list markers', () => {
    const md = pdfPagesToMarkdown(['• A\n    • B\n        • C']);
    expect(md).toContain('- A');
    expect(md).toContain('    - B');
    expect(md).toContain('        - C');

    const value = markdownToSlateValue(md);
    const root = value[0] as unknown as { type: string; children: unknown[] };
    expect(root.type).toBe('bulleted-list');
    const a = root.children[0] as unknown as { type: string; children: unknown[] };

    const nested1 = a.children.find((c) => {
      if (!c || typeof c !== 'object') return false;
      const rec = c as Record<string, unknown>;
      return rec.type === 'bulleted-list' && Array.isArray(rec.children);
    });

    expect(nested1).toBeTruthy();
    const nested1Rec = nested1 as unknown as { children: unknown[] };
    const b = nested1Rec.children[0] as unknown as { children: unknown[] };

    const nested2 = b.children.find((c) => {
      if (!c || typeof c !== 'object') return false;
      const rec = c as Record<string, unknown>;
      return rec.type === 'bulleted-list' && Array.isArray(rec.children);
    });

    expect(nested2).toBeTruthy();
  });
});
