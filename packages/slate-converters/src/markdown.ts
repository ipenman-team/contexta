import { unified } from 'unified';
import remarkParse from 'remark-parse';

import type { SlateText, SlateValue } from './types';

type MdastNode = any;

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

function convertInline(nodes: MdastNode[] | undefined, marks: Marks = {}): SlateText[] {
  if (!nodes?.length) return [{ text: '' }];

  const out: SlateText[] = [];

  for (const node of nodes) {
    if (!node) continue;

    switch (node.type) {
      case 'text':
        out.push({ text: String(node.value ?? ''), ...marks });
        break;
      case 'html': {
        const html = String(node.value ?? '');
        const u = html.match(/^<(u|ins)>([\s\S]*)<\/(u|ins)>$/i);
        if (u) {
          out.push({ text: u[2] ?? '', ...marks, underline: true });
          break;
        }

        out.push({ text: html, ...marks });
        break;
      }
      case 'strong':
        out.push(...convertInline(node.children, { ...marks, bold: true }));
        break;
      case 'emphasis':
        out.push(...convertInline(node.children, { ...marks, italic: true }));
        break;
      case 'inlineCode':
        out.push({ text: String(node.value ?? ''), ...marks });
        break;
      case 'break':
        out.push({ text: '\n', ...marks });
        break;
      case 'link':
      case 'linkReference':
        // 当前 schema 没有 link inline element：先降级为纯文本。
        out.push(...convertInline(node.children, marks));
        break;
      default:
        if (Array.isArray(node.children)) {
          out.push(...convertInline(node.children, marks));
        } else if (typeof node.value === 'string') {
          out.push({ text: node.value, ...marks });
        }
    }
  }

  return out.length ? out : [{ text: '' }];
}

function convertBlocks(node: MdastNode): SlateValue {
  if (!node) return [];

  switch (node.type) {
    case 'paragraph':
      return [ensureParagraph(convertInline(node.children))];

    case 'heading': {
      const depth = Number(node.depth ?? 1);
      const type = depth === 1 ? 'heading-one' : 'heading-two';
      return [
        {
          type,
          children: convertInline(node.children),
        },
      ];
    }

    case 'blockquote': {
      const inner: SlateValue = [];
      for (const child of node.children ?? []) {
        inner.push(...convertBlocks(child));
      }
      return [
        {
          type: 'block-quote',
          children: (inner.length ? inner : [ensureParagraph([{ text: '' }])]) as any,
        },
      ];
    }

    case 'list': {
      const ordered = Boolean(node.ordered);
      const listType = ordered ? 'numbered-list' : 'bulleted-list';

      const items = (node.children ?? []).map((item: MdastNode) => {
        const itemBlocks: SlateValue = [];
        for (const child of item?.children ?? []) {
          itemBlocks.push(...convertBlocks(child));
        }
        const normalized = itemBlocks.length ? itemBlocks : [ensureParagraph([{ text: '' }])];

        return {
          type: 'list-item',
          children: normalized as any,
        };
      });

      return [
        {
          type: listType,
          children: items as any,
        },
      ];
    }

    case 'code': {
      const value = String(node.value ?? '');
      return [ensureParagraph([{ text: value }])];
    }

    case 'thematicBreak':
      return [ensureParagraph([{ text: '' }])];

    default: {
      if (Array.isArray(node.children)) {
        const blocks: SlateValue = [];
        for (const child of node.children) blocks.push(...convertBlocks(child));
        return blocks;
      }
      return [];
    }
  }
}

export function markdownToSlateValue(markdown: string): SlateValue {
  const raw = normalizeMarkdown(markdown);
  const tree = unified().use(remarkParse).parse(raw) as MdastNode;

  const blocks: SlateValue = [];
  for (const child of tree?.children ?? []) {
    blocks.push(...convertBlocks(child));
  }

  return blocks.length ? blocks : [ensureParagraph([{ text: '' }])];
}
