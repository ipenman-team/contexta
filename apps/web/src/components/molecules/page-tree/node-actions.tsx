import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  PageTreeAddButton,
  PageTreeMenuTrigger,
} from '@/components/atoms/page-tree';
import { useCreatingPage, useNodeMenuState } from '@/stores';

export const PageTreeNodeActions = memo(function PageTreeNodeActions({
  nodeId,
  onCreateChild,
  onToggleMenu,
}: {
  nodeId: string;
  onCreateChild: () => void;
  onToggleMenu: () => void;
}) {
  const creatingPage = useCreatingPage();
  const isMenuOpen = useNodeMenuState(nodeId);

  const handleToggleMenu = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onToggleMenu();
    },
    [onToggleMenu]
  );

  const handleCreateChild = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCreateChild();
    },
    [onCreateChild]
  );

  return (
    <div
      className={cn(
        'ml-1 flex items-center gap-0.5',
        'opacity-0 transition-opacity group-hover:opacity-100'
      )}
    >
      <PageTreeAddButton onClick={handleCreateChild} disabled={creatingPage} />
      <PageTreeMenuTrigger isOpen={isMenuOpen} onToggle={handleToggleMenu} />
    </div>
  );
});
