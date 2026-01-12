import { memo } from 'react';
import { Tree } from '@/components/common/tree';
import { PageTreeItem } from './tree-item';
import { usePageTreeNodes, useSelectedPageId } from '@/stores';
import type { PageDto } from '@/lib/api';

export const PageTreeList = memo(function PageTreeList({
  onCreateChildPage,
  onCommitRename,
}: {
  onCreateChildPage?: (node: any) => void;
  onCommitRename?: () => void;
}) {
  const nodes = usePageTreeNodes();
  const selectedPageId = useSelectedPageId();

  return (
    <Tree<PageDto>
      nodes={nodes}
      selectedId={selectedPageId ?? undefined}
      renderNode={(ctx) => (
        <PageTreeItem
          {...ctx}
          onCreateChildPage={onCreateChildPage}
          onCommitRename={onCommitRename}
        />
      )}
    />
  );
});
