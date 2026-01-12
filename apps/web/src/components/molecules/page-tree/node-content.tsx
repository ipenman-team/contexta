import { memo } from 'react';
import {
  PageTreeLabel,
  PageTreeRenameInput,
} from '@/components/atoms/page-tree';
import {
  useIsNodeRenaming,
  useRenamingValue,
  useSavingRename,
  useUIStateStore,
} from '@/stores';

export const PageTreeNodeContent = memo(function PageTreeNodeContent({
  nodeId,
  label,
  isSelected,
  onSelect,
  onCommitRename,
}: {
  nodeId: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  onCommitRename: () => void;
}) {
  const isRenaming = useIsNodeRenaming(nodeId);
  const renamingValue = useRenamingValue();
  const savingRename = useSavingRename();
  const { setRenamingValue, cancelRename } = useUIStateStore();

  if (isRenaming) {
    return (
      <PageTreeRenameInput
        value={renamingValue}
        disabled={savingRename}
        onChange={setRenamingValue}
        onCommit={onCommitRename}
        onCancel={cancelRename}
      />
    );
  }

  return (
    <PageTreeLabel label={label} isSelected={isSelected} onClick={onSelect} />
  );
});
