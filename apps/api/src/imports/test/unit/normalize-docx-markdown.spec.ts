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

  it('reconstructs nested list indentation from mixed bullet markers', () => {
    const md = normalizeDocxMarkdown(['* 登录功能', '', '+ 用户通过手机号+密码登录', '+ 支持找回密码', '', '* 注册功能', '', '+ 用户通过手机号注册', ''].join('\n'));
    expect(md).toContain('- 登录功能');
    expect(md).toContain('  - 用户通过手机号+密码登录');
    expect(md).toContain('  - 支持找回密码');
    expect(md).toContain('- 注册功能');
    expect(md).toContain('  - 用户通过手机号注册');
  });

  it('keeps ordered list item titles when reconstructing list levels', () => {
    const md = normalizeDocxMarkdown(
      ['1. 入口设计', '', '- Web 端和桌面端：右上角增加消息图标', '', '2. 消息分类', '', '- 系统公告：版本更新、维护通知', ''].join(
        '\n',
      ),
    );
    expect(md).toContain('1. 入口设计');
    expect(md).toContain('1. 消息分类');
    expect(md).toContain('- Web 端和桌面端：右上角增加消息图标');
    expect(md).toContain('- 系统公告：版本更新、维护通知');
  });
});
