import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const PageTreeLabel = memo(function PageTreeLabel({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        'h-9 w-full flex-1 justify-start px-2',
        isSelected && 'bg-accent text-accent-foreground'
      )}
      onClick={onClick}
    >
      <span className="truncate">{label}</span>
    </Button>
  );
});
