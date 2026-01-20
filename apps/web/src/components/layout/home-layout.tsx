import { memo } from 'react';

export const HomeLayout = memo(function HomeLayout({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {sidebar}
      <main className="flex-1 min-h-0 overflow-auto" aria-live="polite">
        {children}
      </main>
    </div>
  );
});
