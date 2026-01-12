import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';

export const PageTreeMenuTrigger = memo(function PageTreeMenuTrigger({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: (e: React.PointerEvent) => void;
}) {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onToggle(e);
    },
    [onToggle]
  );

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-7 w-7 px-0 text-muted-foreground"
      aria-label="更多"
      aria-expanded={isOpen}
      onPointerDown={handlePointerDown}
    >
      …
    </Button>
  );
});
