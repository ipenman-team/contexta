import React, { memo, useCallback } from 'react';
import type { TreeNode } from '@/components/common/tree';
import type { TreeRenderContext } from '@/components/common/tree';
import { PageTreeExpandButton, PageTreeSpacer } from '@/components/atoms/page-tree';
import {
  PageTreeNodeActions,
  PageTreeNodeContent,
  PageTreeContextMenu,
} from '@/components/molecules/page-tree';
import {
  useIsPageSelected,
  useNodeMenuState,
  usePageSelectionStore,
  useUIStateStore,
} from '@/stores';
import type { PageDto, pagesApi } from '@/lib/api';

// 🔑 CRITICAL COMPONENT: Solves the "entire tree re-renders" problem
// This component demonstrates the key performance optimization patterns:
// 1. Per-node subscriptions: useIsPageSelected(node.id) instead of prop-based selectedId
// 2. Custom memo comparison: Only re-renders when THIS node's data actually changes
// 3. All event handlers wrapped in useCallback with stable dependencies

interface PageTreeItemProps<T> extends TreeRenderContext<T> {
  onCreateChildPage?: (node: TreeNode<T>) => void;
  onCommitRename?: () => void;
}

export const PageTreeItem = memo(function PageTreeItem<T = PageDto>({
  node,
  depth,
  hasChildren,
  expanded,
  toggleExpanded,
  onCreateChildPage,
  onCommitRename,
}: PageTreeItemProps<T>) {
  // ✅ KEY OPTIMIZATION: Per-node subscription
  // Only THIS node re-renders when its selection state changes
  // Other nodes remain untouched!
  const isSelected = useIsPageSelected(node.id);
  const isMenuOpen = useNodeMenuState(node.id);

  // Get store actions
  const { setSelectedPage } = usePageSelectionStore();
  const { setOpenMenuNodeId, startRename, setDeleteTarget } = useUIStateStore();

  // ✅ All callbacks memoized to prevent child re-renders
  const handleSelect = useCallback(() => {
    setSelectedPage(node.id, node.label);
  }, [node.id, node.label, setSelectedPage]);

  const handleToggleMenu = useCallback(() => {
    setOpenMenuNodeId(isMenuOpen ? null : node.id);
  }, [isMenuOpen, node.id, setOpenMenuNodeId]);

  const handleCreateChild = useCallback(() => {
    if (onCreateChildPage) {
      onCreateChildPage(node);
    }
  }, [node, onCreateChildPage]);

  const handleRename = useCallback(() => {
    setOpenMenuNodeId(null);
    setSelectedPage(node.id, node.label);
    startRename(node.id, node.label);
  }, [node.id, node.label, setOpenMenuNodeId, setSelectedPage, startRename]);

  const handleDelete = useCallback(() => {
    setOpenMenuNodeId(null);
    setDeleteTarget({ id: node.id, title: node.label });
  }, [node.id, node.label, setOpenMenuNodeId, setDeleteTarget]);

  const handleCommitRename = useCallback(() => {
    if (onCommitRename) {
      onCommitRename();
    }
  }, [onCommitRename]);

  return (
    <div
      className="group flex items-center"
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      {hasChildren ? (
        <PageTreeExpandButton expanded={expanded} onClick={toggleExpanded} />
      ) : (
        <PageTreeSpacer />
      )}

      <PageTreeNodeContent
        nodeId={node.id}
        label={node.label}
        isSelected={isSelected}
        onSelect={handleSelect}
        onCommitRename={handleCommitRename}
      />

      <PageTreeNodeActions
        nodeId={node.id}
        onCreateChild={handleCreateChild}
        onToggleMenu={handleToggleMenu}
      />

      <div className="relative">
        <PageTreeContextMenu
          nodeId={node.id}
          label={node.label}
          isOpen={isMenuOpen}
          onRename={handleRename}
          onDelete={handleDelete}
          onClose={() => setOpenMenuNodeId(null)}
        />
      </div>
    </div>
  );
},
// ✅ Custom comparison function - only re-render if THIS node's data changed
(prevProps, nextProps) => {
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.label === nextProps.node.label &&
    prevProps.depth === nextProps.depth &&
    prevProps.hasChildren === nextProps.hasChildren &&
    prevProps.expanded === nextProps.expanded
  );
}) as <T = PageDto>(props: PageTreeItemProps<T>) => React.JSX.Element;
