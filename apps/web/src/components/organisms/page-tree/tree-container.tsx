import { memo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageTreeHeader } from './tree-header';
import { PageTreeList } from './tree-list';
import {
  usePagesLoaded,
  usePageTreeNodes,
  usePageTreeStore,
  usePageSelectionStore,
  useUIStateStore,
  useCreatingPage,
} from '@/stores';
import { pagesApi, type PageDto } from '@/lib/api';
import { buildPageTreeFromFlatPages } from '@contexta/shared';
import type { TreeNode } from '@/components/common/tree';

// Business logic orchestrator for the page tree
export const PageTreeContainer = memo(function PageTreeContainer({
  onOpenImport,
}: {
  onOpenImport: () => void;
}) {
  const pagesLoaded = usePagesLoaded();
  const nodes = usePageTreeNodes();
  const creatingPage = useCreatingPage();
  const { setPageTreeNodes, setPagesLoaded, setCreatingPage } =
    usePageTreeStore();
  const { setSelectedPage } = usePageSelectionStore();
  const { setSavingRename, cancelRename } = useUIStateStore();
  const renamingTarget = useUIStateStore((s) => s.renamingTarget);
  const renamingValue = useUIStateStore((s) => s.renamingValue);

  const refreshPages = useCallback(async () => {
    try {
      const pages = await pagesApi.list();
      setPageTreeNodes(buildPageTreeFromFlatPages(pages));
    } finally {
      setPagesLoaded(true);
    }
  }, [setPageTreeNodes, setPagesLoaded]);

  const handleCreatePage = useCallback(async () => {
    if (creatingPage) return;
    try {
      setCreatingPage(true);
      const page = await pagesApi.create({ title: '无标题文档' });
      setSelectedPage(page.id, page.title);
      await refreshPages();
    } finally {
      setCreatingPage(false);
    }
  }, [creatingPage, setCreatingPage, setSelectedPage, refreshPages]);

  const handleCreateChildPage = useCallback(
    async (parent: TreeNode<PageDto>) => {
      if (creatingPage) return;
      const parentIds = [...(parent.data?.parentIds ?? []), parent.id];
      try {
        setCreatingPage(true);
        const page = await pagesApi.create({
          title: '无标题文档',
          parentIds,
        });
        setSelectedPage(page.id, page.title);
        await refreshPages();
      } finally {
        setCreatingPage(false);
      }
    },
    [creatingPage, setCreatingPage, setSelectedPage, refreshPages]
  );

  const handleCommitRename = useCallback(async () => {
    if (!renamingTarget) return;

    const nextTitle = renamingValue.trim() || '无标题文档';

    try {
      setSavingRename(true);
      const page = await pagesApi.save(renamingTarget.id, {
        title: nextTitle,
      });

      // Update selection if we're renaming the currently selected page
      const { selected } = usePageSelectionStore.getState();
      if (selected.kind === 'page' && selected.id === page.id) {
        setSelectedPage(page.id, page.title);
      }

      await refreshPages();
      cancelRename();
    } finally {
      setSavingRename(false);
    }
  }, [
    renamingTarget,
    renamingValue,
    setSavingRename,
    setSelectedPage,
    refreshPages,
    cancelRename,
  ]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pages = await pagesApi.list();
        if (cancelled) return;
        setPageTreeNodes(buildPageTreeFromFlatPages(pages));
      } catch {
        if (cancelled) return;
        setPageTreeNodes([]);
      } finally {
        if (cancelled) return;
        setPagesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setPageTreeNodes, setPagesLoaded]);

  const empty = pagesLoaded && nodes.length === 0;

  if (empty) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full justify-start px-2"
        disabled={creatingPage}
        onClick={handleCreatePage}
      >
        新建
      </Button>
    );
  }

  return (
    <>
      <PageTreeHeader
        onCreatePage={handleCreatePage}
        onOpenImport={onOpenImport}
      />
      <PageTreeList
        onCreateChildPage={handleCreateChildPage}
        onCommitRename={handleCommitRename}
      />
      <Separator />
    </>
  );
});
