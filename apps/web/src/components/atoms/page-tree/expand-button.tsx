import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';

export const PageTreeExpandButton = memo(function PageTreeExpandButton({
  expanded,
  onClick,
  disabled,
}: {
  expanded: boolean;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(e);
    },
    [onClick]
  );

  return (
    <Button
      type="button"
      variant="ghost"
      className="mr-1 h-7 w-7 px-0 text-muted-foreground"
      onClick={handleClick}
      disabled={disabled}
      aria-label={expanded ? '收起' : '展开'}
      aria-expanded={expanded}
    >
      {expanded ? '▾' : '▸'}
    </Button>
  );
});
