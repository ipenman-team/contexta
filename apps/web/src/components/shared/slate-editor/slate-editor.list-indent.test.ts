import { describe, expect, it } from "vitest";
import { createEditor, type Descendant, type Range } from "slate";

import { handleEnterInList, indentListItem, toggleList } from "./list-commands";

type TextNode = { text: string };
type ParagraphNode = { type: "paragraph"; children: TextNode[] };
type ListItemNode = { type: "list-item"; children: Array<TextNode | ParagraphNode | ListNode> };
type ListNode = { type: "bulleted-list" | "numbered-list"; children: ListItemNode[] };
type TypedElement = { type: string; children?: unknown[] };

describe("slate-editor list indent", () => {
  it("Tab indent does not throw and keeps list structure valid", () => {
    const editor = createEditor();
    const doc: Descendant[] = [
      {
        type: "bulleted-list",
        children: [
          { type: "list-item", children: [{ text: "过去了几个环节" }] },
          { type: "list-item", children: [{ text: "" }] },
        ],
      },
    ] as unknown as Descendant[];
    editor.children = doc;

    editor.selection = {
      anchor: { path: [0, 1, 0], offset: 0 },
      focus: { path: [0, 1, 0], offset: 0 },
    } as Range;

    expect(() => indentListItem(editor)).not.toThrow();

    const rootList = editor.children[0] as unknown as ListNode;
    expect(rootList.type).toBe("bulleted-list");

    const firstItem = rootList.children[0];
    expect(firstItem.type).toBe("list-item");

    const nestedList = firstItem.children[1] as ListNode;
    expect(nestedList.type).toBe("bulleted-list");
    expect(Array.isArray(nestedList.children)).toBe(true);
    expect(nestedList.children.length).toBe(1);
    expect(nestedList.children[0].type).toBe("list-item");
  });

  it("Can switch nested list type to support mixed nesting", () => {
    const editor = createEditor();
    const doc: Descendant[] = [
      {
        type: "bulleted-list",
        children: [
          { type: "list-item", children: [{ text: "一级" }] },
          { type: "list-item", children: [{ text: "二级" }] },
        ],
      },
    ] as unknown as Descendant[];
    editor.children = doc;

    editor.selection = {
      anchor: { path: [0, 1, 0], offset: 0 },
      focus: { path: [0, 1, 0], offset: 0 },
    } as Range;

    indentListItem(editor);

    editor.selection = {
      anchor: { path: [0, 0, 1, 0, 0], offset: 0 },
      focus: { path: [0, 0, 1, 0, 0], offset: 0 },
    } as Range;

    toggleList(editor, "numbered-list");

    const rootList = editor.children[0] as unknown as ListNode;
    const nestedList = rootList.children[0].children[1] as ListNode;
    expect(rootList.type).toBe("bulleted-list");
    expect(nestedList.type).toBe("numbered-list");
  });
});

describe("slate-editor list enter", () => {
  it("Enter in list creates same-level list item when current item has content", () => {
    const editor = createEditor();
    editor.children = [
      {
        type: "bulleted-list",
        children: [
          {
            type: "list-item",
            children: [{ type: "paragraph", children: [{ text: "x" }] }],
          },
        ],
      },
    ] as unknown as Descendant[];

    editor.selection = {
      anchor: { path: [0, 0, 0, 0], offset: 1 },
      focus: { path: [0, 0, 0, 0], offset: 1 },
    } as Range;

    expect(handleEnterInList(editor)).toBe(true);

    const rootList = editor.children[0] as unknown as ListNode;
    expect(rootList.type).toBe("bulleted-list");
    expect(rootList.children.length).toBe(2);
    expect(rootList.children[1].type).toBe("list-item");
  });

  it("Enter on empty item outdents level by level then exits list", () => {
    const editor = createEditor();
    editor.children = [
      {
        type: "bulleted-list",
        children: [
          {
            type: "list-item",
            children: [
              { type: "paragraph", children: [{ text: "L1" }] },
              {
                type: "bulleted-list",
                children: [
                  {
                    type: "list-item",
                    children: [
                      { type: "paragraph", children: [{ text: "L2" }] },
                      {
                        type: "bulleted-list",
                        children: [{ type: "list-item", children: [{ type: "paragraph", children: [{ text: "" }] }] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ] as unknown as Descendant[];

    editor.selection = {
      anchor: { path: [0, 0, 1, 0, 1, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 1, 0, 1, 0, 0, 0], offset: 0 },
    } as Range;
    expect(handleEnterInList(editor)).toBe(true);

    editor.selection = {
      anchor: { path: [0, 0, 1, 1, 0, 0], offset: 0 },
      focus: { path: [0, 0, 1, 1, 0, 0], offset: 0 },
    } as Range;
    expect(handleEnterInList(editor)).toBe(true);

    editor.selection = {
      anchor: { path: [0, 1, 0, 0], offset: 0 },
      focus: { path: [0, 1, 0, 0], offset: 0 },
    } as Range;
    expect(handleEnterInList(editor)).toBe(true);

    expect((editor.children[1] as unknown as TypedElement).type).toBe("paragraph");
  });
});
