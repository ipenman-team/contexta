"use client";

import { memo, useCallback } from 'react';
import { usePageSelectionStore } from '@/stores';
import type { ViewId } from '@/features/home/types';
import { UserProfilePanel } from '../profile';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { spacesApi, type SpaceDto } from '@/lib/api';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// const CreateSpaceModal = dynamic(
//   () => import('@/components/space/create-space-modal'),
//   { ssr: false },
// );
import {
  BookMinus,
  BotIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
} from 'lucide-react';
import CreateSpaceModal from '../space/create-space-modal';

export const HomeSidebar = memo(function HomeSidebar(...props: any) {
  const { setSelectedView } = usePageSelectionStore();
  const [spaces, setSpaces] = useState<SpaceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const handleSelectView = useCallback(
    (id: ViewId) => setSelectedView(id),
    [setSelectedView],
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    spacesApi
      .list({ skip: 0, take: 100 })
      .then((res) => {
        if (!mounted) return;
        setSpaces(res.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreated = (created: SpaceDto) => {
    setSpaces((s) => [created, ...s]);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex justify-between p-3">
            <div></div>
            <div>
              <UserProfilePanel />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem
                  key="dashboard"
                  onClick={() => handleSelectView('dashboard')}
                >
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <LayoutDashboardIcon />
                      <span className="font-bold">仪表盘</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem
                  key="contexta-ai"
                  onClick={() => handleSelectView('contexta-ai')}
                >
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <BotIcon />
                      <span className="font-bold">ContextA AI</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex justify-between flex-1">
                空间
                <PlusCircleIcon
                  className="w-4 h-4 cursor-pointer text-muted-foreground"
                  onClick={() => setOpenCreate(true)}
                />
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading ? (
                  <div className="px-2 text-sm text-muted-foreground">
                    加载中…
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="px-2 text-sm text-muted-foreground">
                    暂无空间
                  </div>
                ) : (
                  spaces.map((space) => (
                    <SidebarMenuItem key={space.id}>
                      <SidebarMenuButton asChild>
                        <div className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                          <BookMinus
                            size={20}
                            strokeWidth={2}
                            color={space.color || 'currentColor'}
                          />
                          <span>{space.name}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {openCreate && (
          <CreateSpaceModal
            open={openCreate}
            onOpenChange={setOpenCreate}
            onCreated={handleCreated}
          />
        )}
        {/* <SidebarContent>
        <PageTreeContainer onOpenImport={onOpenImport} />
      </SidebarContent>

      <Separator />

      <SidebarFooter>
        <SidebarItem
          label="设置"
          active={selected.kind === 'view' && selected.id === 'settings'}
          onClick={() => handleSelectView('settings')}
        />
      </SidebarFooter> */}
      </Sidebar>
    </SidebarProvider>
  );
});
