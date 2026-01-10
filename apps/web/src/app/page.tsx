"use client";

import { useState } from "react";

import { Tree, type TreeNode } from "@/components/common/tree";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ViewId = "dashboard" | "notion-ai" | "settings";

type Selected =
  | { kind: "view"; id: ViewId }
  | { kind: "page"; id: string; title: string };

function SidebarItem(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-9 w-full justify-start gap-2 px-2",
        props.active && "bg-accent text-accent-foreground",
      )}
      onClick={props.onClick}
    >
      <span className="truncate">{props.label}</span>
    </Button>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold text-muted-foreground">{props.title}</div>
      <div>{props.children}</div>
    </section>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<Selected>({
    kind: "view",
    id: "dashboard",
  });

  const dashboardCards = [
    { title: "新页面", meta: "2 小时前" },
    { title: "Getting Started", meta: "2022 年 5 月 19 日" },
    { title: "新数据库", meta: "2025 年 5 月 6 日" },
    { title: "新建页面", meta: "", disabled: true },
  ];

  const templateCards = [
    { title: "项目规划" },
    { title: "会议纪要" },
    { title: "周报" },
  ];

  const pageTreeNodes: TreeNode[] = [
    { id: "p:getting-started", label: "Getting Started" },
    {
      id: "p:journal",
      label: "Journal",
      children: [
        {
          id: "p:journal:2026",
          label: "2026",
          children: [
            {
              id: "p:journal:2026:01",
              label: "01 月",
              children: [{ id: "p:journal:2026:01:10", label: "01-10" }],
            },
          ],
        },
      ],
    },
    { id: "p:team-home", label: "Team Home" },
    {
      id: "p:projects:contexta",
      label: "ContextA",
      children: [
        { id: "p:projects:contexta:prd", label: "PRD" },
        { id: "p:projects:contexta:plan", label: "计划" },
      ],
    },
    {
      id: "p:meetings",
      label: "会议",
      children: [
        {
          id: "p:meetings:weekly",
          label: "周会",
          children: [{ id: "p:meetings:weekly:notes", label: "纪要" }],
        },
      ],
    }
  ];

  function renderMain() {
    if (selected.kind === "view" && selected.id === "dashboard") {
      return (
        <div className="mx-auto w-full max-w-5xl space-y-10">
          <div className="pt-2 text-4xl font-bold tracking-tight">晚上好呀</div>

          <Section title="指南">
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>从这里开始</CardTitle>
                <CardDescription>
                  在左侧选择不同入口，右侧内容会随之变化。这里是仪表盘页的简介与指南区域。
                </CardDescription>
              </CardHeader>
            </Card>
          </Section>

          <Section title="最近访问">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {dashboardCards.map((c) => (
                <Card
                  key={c.title}
                  className={cn(
                    "cursor-default select-none transition-colors",
                    c.disabled && "opacity-60",
                  )}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="truncate text-sm">{c.title}</CardTitle>
                    {c.meta ? (
                      <CardDescription className="text-xs">{c.meta}</CardDescription>
                    ) : null}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </Section>

          <Section title="模版">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {templateCards.map((c) => (
                <Card key={c.title} className="cursor-default select-none">
                  <CardHeader className="p-4">
                    <CardTitle className="truncate text-sm">{c.title}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </Section>
        </div>
      );
    }

    if (selected.kind === "page") {
      return (
        <div className="mx-auto w-full max-w-5xl space-y-2 pt-6">
          <div className="text-2xl font-bold tracking-tight">{selected.title}</div>
          <div className="text-sm text-muted-foreground">这里是页面内容占位。</div>
        </div>
      );
    }

    const titleById: Record<ViewId, string> = {
      dashboard: "仪表盘",
      "notion-ai": "Notion AI",
      settings: "设置",
    };

    return (
      <div className="mx-auto w-full max-w-5xl space-y-2 pt-6">
        <div className="text-2xl font-bold tracking-tight">{titleById[selected.id]}</div>
        <div className="text-sm text-muted-foreground">该区域会随左侧选中项变化。</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="w-72 border-r bg-muted/30">
        <div className="flex h-dvh flex-col gap-4 overflow-auto p-3">
          <SidebarItem
            label="仪表盘"
            active={selected.kind === "view" && selected.id === "dashboard"}
            onClick={() => setSelected({ kind: "view", id: "dashboard" })}
          />

          <SidebarItem
            label="Notion AI"
            active={selected.kind === "view" && selected.id === "notion-ai"}
            onClick={() => setSelected({ kind: "view", id: "notion-ai" })}
          />

          <Separator />

          <Button
            type="button"
            variant="ghost"
            className="h-8 w-full justify-start px-2 text-xs font-medium tracking-wide text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
          >
            页面
          </Button>

          <Tree
            nodes={pageTreeNodes}
            selectedId={selected.kind === "page" ? selected.id : undefined}
            renderNode={({
              node,
              depth,
              selected: isSelected,
              hasChildren,
              expanded,
              toggleExpanded,
            }) => (
              <div
                className="flex items-center"
                style={{ paddingLeft: 8 + depth * 14 }}
              >
                {hasChildren ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mr-1 h-7 w-7 px-0 text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded();
                    }}
                    aria-label={expanded ? "收起" : "展开"}
                    aria-expanded={expanded}
                  >
                    {expanded ? "▾" : "▸"}
                  </Button>
                ) : (
                  <span className="mr-1 h-7 w-7" aria-hidden="true" />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-9 w-full flex-1 justify-start px-2",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => setSelected({ kind: "page", id: node.id, title: node.label })}
                >
                  <span className="truncate">{node.label}</span>
                </Button>
              </div>
            )}
          />

          <Separator />

          <SidebarItem
            label="设置"
            active={selected.kind === "view" && selected.id === "settings"}
            onClick={() => setSelected({ kind: "view", id: "settings" })}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-auto" aria-live="polite">
        <div className="px-6 py-10 lg:px-11">{renderMain()}</div>
      </main>
    </div>
  );
}
