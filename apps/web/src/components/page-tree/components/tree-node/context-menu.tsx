import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreatingPage } from '@/stores';

/**
 * 树节点右键菜单
 * 提供重命名和删除操作
 */
export const TreeNodeContextMenu = memo(function TreeNodeContextMenu({
  nodeId,
  label,
  isOpen,
  onCreateChild,
  onRename,
  onDelete,
  onClose,
}: {
  nodeId: string;
  label: string;
  isOpen: boolean;
  onCreateChild?: () => void;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const creatingPage = useCreatingPage();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null
  );

  const updatePosition = useCallback(() => {
    if (typeof document === 'undefined') return;
    const el = document.querySelector(
      `[data-node-menu-trigger="${nodeId}"]`
    );
    if (!(el instanceof HTMLElement)) return;

    const rect = el.getBoundingClientRect();
    const menuWidth = 112;
    const gap = 4;
    const padding = 8;
    const left = Math.min(
      Math.max(rect.right - menuWidth, padding),
      window.innerWidth - padding - menuWidth
    );
    const top = Math.min(rect.bottom + gap, window.innerHeight - padding);
    setPosition({ top, left });
  }, [nodeId]);

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => updatePosition());

    const onAnyScroll = () => updatePosition();
    window.addEventListener('resize', onAnyScroll);
    window.addEventListener('scroll', onAnyScroll, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onAnyScroll);
      window.removeEventListener('scroll', onAnyScroll, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen, onClose]);

  const handleCreateChild = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onCreateChild?.();
    },
    [onCreateChild]
  );

  const handleRename = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onRename();
    },
    [onRename]
  );

  const handleDelete = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
    },
    [onDelete]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;
  if (!position) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: position.top, left: position.left }}
      className={cn(
        'fixed z-50 w-28 overflow-hidden rounded-md border bg-popover text-popover-foreground'
      )}
      aria-label={`${label}-${nodeId}`}
      data-node-id={nodeId}
      onPointerDown={handlePointerDown}
    >
      {onCreateChild ? (
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full justify-start rounded-none px-2"
          disabled={creatingPage}
          onPointerDown={handleCreateChild}
        >
          新建子页面
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="h-9 w-full justify-start rounded-none px-2"
        onPointerDown={handleRename}
      >
        重命名
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="h-9 w-full justify-start rounded-none px-2 text-destructive"
        onPointerDown={handleDelete}
      >
        删除
      </Button>
    </div>
    ,
    document.body
  );
});
