import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

export const PageTreeRenameInput = memo(function PageTreeRenameInput({
  value,
  disabled,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onCommit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    },
    [onCommit, onCancel]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <input
      className={cn(
        'h-9 w-full flex-1 rounded-md border bg-background px-2 text-sm',
        'border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
      )}
      value={value}
      autoFocus
      disabled={disabled}
      onChange={handleChange}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
    />
  );
});
