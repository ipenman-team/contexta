import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';

export const PageTreeAddButton = memo(function PageTreeAddButton({
  onClick,
  disabled,
}: {
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
      className="h-7 w-7 px-0 text-muted-foreground"
      aria-label="新建子页面"
      disabled={disabled}
      onClick={handleClick}
    >
      +
    </Button>
  );
});
