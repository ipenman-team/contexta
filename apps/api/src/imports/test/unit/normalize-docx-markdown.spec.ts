import { normalizeDocxMarkdown } from '../../imports.utils';

describe('normalizeDocxMarkdown', () => {
  it('normalizes headings to at most two levels', () => {
    const md = normalizeDocxMarkdown('# A\n## B\n### C\n#### D\n');
    expect(md).toContain('# A');
    expect(md).toContain('## B');
    expect(md).toContain('## C');
    expect(md).toContain('## D');
  });

  it('removes images', () => {
    const md = normalizeDocxMarkdown('hello ![alt](https://example.com/a.png) world');
    expect(md).toContain('hello');
    expect(md).toContain('world');
    expect(md).not.toContain('![');
  });

  it('keeps underline tags and strips other html tags', () => {
    const md = normalizeDocxMarkdown('a <u>b</u> <span>c</span> <ins>d</ins>');
    expect(md).toContain('<u>b</u>');
    expect(md).toContain('<ins>d</ins>');
    expect(md).not.toContain('<span>');
  });

  it('collapses excessive blank lines', () => {
    const md = normalizeDocxMarkdown('a\n\n\n\nb\n');
    expect(md).toBe('a\n\nb\n');
  });
});

