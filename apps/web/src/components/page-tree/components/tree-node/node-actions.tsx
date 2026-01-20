import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNodeMenuState } from '@/stores';

/**
 * 树节点操作按钮组
 * 包含：新增子页面、打开菜单
 *
 * 合并了以下原组件：
 * - atoms/page-tree/add-button.tsx (+ 按钮)
 * - atoms/page-tree/menu-trigger.tsx (... 按钮)
 * - molecules/page-tree/node-actions.tsx (按钮组编排)
 */
export const TreeNodeActions = memo(function TreeNodeActions({
  nodeId,
  onToggleMenu,
}: {
  nodeId: string;
  onToggleMenu: () => void;
}) {
  const isMenuOpen = useNodeMenuState(nodeId);

  const handleToggleMenu = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onToggleMenu();
    },
    [onToggleMenu]
  );

  return (
    <div
      className={cn(
        'ml-1 flex shrink-0 items-center gap-0.5',
        'opacity-0 transition-opacity group-hover:opacity-100'
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-7 w-7 px-0 text-muted-foreground"
        data-node-menu-trigger={nodeId}
        aria-label="更多"
        aria-expanded={isMenuOpen}
        onPointerDown={handleToggleMenu}
      >
        …
      </Button>
    </div>
  );
});
