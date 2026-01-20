import { Editor, Element as SlateElement, Node, Path, Range, Text, Transforms } from "slate";

type BlockFormat = "numbered-list" | "bulleted-list";

const LIST_ITEM_TYPE = "list-item";

function isListElement(node: unknown): node is SlateElement & { type: BlockFormat } {
  if (!SlateElement.isElement(node)) return false;
  const type = (node as SlateElement & { type?: string }).type;
  return type === "bulleted-list" || type === "numbered-list";
}

function isListItemElement(node: unknown): node is SlateElement & { type: "list-item" } {
  return SlateElement.isElement(node) && (node as SlateElement & { type?: string }).type === LIST_ITEM_TYPE;
}

function getActiveListEntry(editor: Editor) {
  if (!editor.selection) return null;
  const entry = Editor.above(editor, { match: (n) => isListElement(n) });
  return entry as [SlateElement & { type: BlockFormat }, Path] | null;
}

export function isListActive(editor: Editor, format: BlockFormat) {
  const entry = getActiveListEntry(editor);
  if (!entry) return false;
  return entry[0].type === format;
}

export function toggleList(editor: Editor, format: BlockFormat) {
  const activeListEntry = getActiveListEntry(editor);

  if (activeListEntry) {
    const [listNode, listPath] = activeListEntry;

    if (listNode.type === format) {
      Transforms.setNodes(
        editor,
        { type: "paragraph" } as unknown as Partial<SlateElement>,
        {
          at: listPath,
          match: (n) => isListItemElement(n),
        },
      );
      Transforms.unwrapNodes(editor, {
        at: listPath,
        match: (n) => isListElement(n),
        split: true,
      });
      return;
    }

    Transforms.setNodes(editor, { type: format } as unknown as Partial<SlateElement>, { at: listPath });
    return;
  }

  Transforms.setNodes(
    editor,
    { type: LIST_ITEM_TYPE } as unknown as Partial<SlateElement>,
    {
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n),
    },
  );

  const block = { type: format, children: [] } as unknown as SlateElement;
  Transforms.wrapNodes(editor, block, {
    match: (n) => isListItemElement(n),
    split: true,
  });
}

export function isInListItem(editor: Editor) {
  if (!editor.selection) return false;
  return Boolean(Editor.above(editor, { match: (n) => isListItemElement(n) }));
}

export function canIndentListItem(editor: Editor) {
  if (!editor.selection) return false;
  const listItemEntry = Editor.above(editor, { match: (n) => isListItemElement(n) }) as
    | [SlateElement & { type: "list-item" }, Path]
    | undefined;
  if (!listItemEntry) return false;
  const [, listItemPath] = listItemEntry;
  const index = listItemPath[listItemPath.length - 1];
  return typeof index === "number" && index > 0;
}

export function indentListItem(editor: Editor) {
  if (!editor.selection) return;

  Editor.withoutNormalizing(editor, () => {
    const listItemEntry = Editor.above(editor, { match: (n) => isListItemElement(n) }) as
      | [SlateElement & { type: "list-item" }, Path]
      | undefined;
    if (!listItemEntry) return;

    const [, listItemPath] = listItemEntry;
    const parentListPath = Path.parent(listItemPath);
    const parentListNode = Node.get(editor, parentListPath);
    if (!isListElement(parentListNode)) return;

    const index = listItemPath[listItemPath.length - 1];
    if (typeof index !== "number" || index === 0) return;

    const prevSiblingPath = Path.previous(listItemPath);
    const prevSiblingNode = Node.get(editor, prevSiblingPath);
    if (!isListItemElement(prevSiblingNode)) return;

    const hasTopLevelText = (prevSiblingNode.children as Node[]).some((child) => Text.isText(child));
    if (hasTopLevelText) {
      const paragraphPath = prevSiblingPath.concat(0);
      Transforms.insertNodes(
        editor,
        { type: "paragraph", children: [{ text: "" }] } as unknown as SlateElement,
        { at: paragraphPath, select: false },
      );

      const afterInsert = Node.get(editor, prevSiblingPath);
      if (isListItemElement(afterInsert)) {
        const indicesToMove = (afterInsert.children as Node[])
          .map((child, idx) => (Text.isText(child) ? idx : -1))
          .filter((idx) => idx >= 0)
          .sort((a, b) => b - a);

        for (const childIndex of indicesToMove) {
          const fromPath = prevSiblingPath.concat(childIndex);
          const paragraphNode = Node.get(editor, paragraphPath);
          const toIndex =
            SlateElement.isElement(paragraphNode) && Array.isArray(paragraphNode.children)
              ? paragraphNode.children.length
              : 0;
          Transforms.moveNodes(editor, { at: fromPath, to: paragraphPath.concat(toIndex) });
        }

        const maybeParagraph = Node.get(editor, paragraphPath);
        if (SlateElement.isElement(maybeParagraph) && maybeParagraph.children.length > 1) {
          const first = maybeParagraph.children[0];
          if (Text.isText(first) && first.text === "") {
            Transforms.removeNodes(editor, { at: paragraphPath.concat(0) });
          }
        }
      }
    }

    const refreshedPrevSiblingNode = Node.get(editor, prevSiblingPath);
    if (!isListItemElement(refreshedPrevSiblingNode)) return;

    const prevChildren = refreshedPrevSiblingNode.children as Node[];
    const existingNestedIndex = prevChildren.findIndex(
      (child) => isListElement(child) && child.type === parentListNode.type,
    );
    let nestedListPath: Path;

    if (existingNestedIndex >= 0) {
      nestedListPath = prevSiblingPath.concat(existingNestedIndex);
    } else {
      const insertIndex = prevChildren.length;
      Transforms.insertNodes(
        editor,
        {
          type: parentListNode.type,
          children: [{ type: LIST_ITEM_TYPE, children: [{ text: "" }] }],
        } as unknown as SlateElement,
        { at: prevSiblingPath.concat(insertIndex), select: false },
      );
      nestedListPath = prevSiblingPath.concat(insertIndex);
    }

    const nestedListNode = Node.get(editor, nestedListPath);
    const nestedChildrenCount = isListElement(nestedListNode) ? nestedListNode.children.length : 0;

    Transforms.moveNodes(editor, {
      at: listItemPath,
      to: nestedListPath.concat(nestedChildrenCount),
    });

    if (existingNestedIndex < 0 && Node.has(editor, nestedListPath.concat(0))) {
      const maybePlaceholder = Node.get(editor, nestedListPath.concat(0));
      if (isListItemElement(maybePlaceholder)) {
        const hasOnlyEmptyText =
          maybePlaceholder.children.length === 1 &&
          !SlateElement.isElement(maybePlaceholder.children[0]) &&
          (maybePlaceholder.children[0] as unknown as { text?: string }).text === "";
        if (hasOnlyEmptyText) Transforms.removeNodes(editor, { at: nestedListPath.concat(0) });
      }
    }
  });
}

export function outdentListItem(editor: Editor) {
  if (!editor.selection) return;

  const listItemEntry = Editor.above(editor, { match: (n) => isListItemElement(n) }) as
    | [SlateElement & { type: "list-item" }, Path]
    | undefined;
  if (!listItemEntry) return;

  const [, listItemPath] = listItemEntry;
  const parentListPath = Path.parent(listItemPath);
  const parentListNode = Node.get(editor, parentListPath);
  if (!isListElement(parentListNode)) return;

  if (parentListPath.length < 2) return;
  const parentListItemPath = Path.parent(parentListPath);
  const parentListItemNode = Node.get(editor, parentListItemPath);
  if (!isListItemElement(parentListItemNode)) return;

  const higherListPath = Path.parent(parentListItemPath);
  const higherListNode = Node.get(editor, higherListPath);
  if (!isListElement(higherListNode)) return;

  const parentListItemIndex = parentListItemPath[parentListItemPath.length - 1];
  if (typeof parentListItemIndex !== "number") return;

  Transforms.moveNodes(editor, {
    at: listItemPath,
    to: higherListPath.concat(parentListItemIndex + 1),
  });

  if (Node.has(editor, parentListPath)) {
    const updatedParentListNode = Node.get(editor, parentListPath);
    if (isListElement(updatedParentListNode) && updatedParentListNode.children.length === 0) {
      Transforms.removeNodes(editor, { at: parentListPath });
    }
  }
}

function canOutdentCurrentListItem(editor: Editor) {
  if (!editor.selection) return false;
  const listItemEntry = Editor.above(editor, { match: (n) => isListItemElement(n) }) as
    | [SlateElement & { type: "list-item" }, Path]
    | undefined;
  if (!listItemEntry) return false;
  const [, listItemPath] = listItemEntry;
  const parentListPath = Path.parent(listItemPath);
  if (parentListPath.length < 2) return false;
  const parentListItemPath = Path.parent(parentListPath);
  const parentListItemNode = Node.get(editor, parentListItemPath);
  return isListItemElement(parentListItemNode);
}

function removeEmptyLists(editor: Editor) {
  Transforms.removeNodes(editor, {
    match: (n) => isListElement(n) && (n as SlateElement).children.length === 0,
  });
}

function exitListAtCurrentItem(editor: Editor) {
  if (!editor.selection) return;

  const listItemEntry = Editor.above(editor, { match: (n) => isListItemElement(n) }) as
    | [SlateElement & { type: "list-item" }, Path]
    | undefined;
  if (!listItemEntry) return;

  const [listItemNode, listItemPath] = listItemEntry;
  const text = Node.string(listItemNode);

  const listEntry = Editor.above(editor, { match: (n) => isListElement(n) }) as
    | [SlateElement & { type: BlockFormat }, Path]
    | undefined;
  if (!listEntry) return;

  Editor.withoutNormalizing(editor, () => {
    Transforms.removeNodes(editor, { at: listItemPath });
    Transforms.insertNodes(
      editor,
      { type: "paragraph", children: [{ text }] } as unknown as SlateElement,
      { at: listItemPath, select: true },
    );
    Transforms.unwrapNodes(editor, {
      at: listItemPath,
      match: (n) => isListElement(n),
      split: true,
    });
    removeEmptyLists(editor);
  });
}

export function handleEnterInList(editor: Editor) {
  if (!editor.selection) return false;
  const listItemEntry = Editor.above(editor, { match: (n) => isListItemElement(n) }) as
    | [SlateElement & { type: "list-item" }, Path]
    | undefined;
  if (!listItemEntry) return false;

  const [listItemNode] = listItemEntry;

  Editor.withoutNormalizing(editor, () => {
    if (!Range.isCollapsed(editor.selection!)) {
      Transforms.delete(editor);
    }

    const isEmpty = Node.string(listItemNode).trim() === "";
    if (!isEmpty) {
      Transforms.splitNodes(editor, { match: (n) => isListItemElement(n), always: true });
      return;
    }

    if (canOutdentCurrentListItem(editor)) {
      outdentListItem(editor);
      return;
    }

    exitListAtCurrentItem(editor);
  });

  return true;
}
