import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  content: ReactNode;
  showSidebarOnMobile?: boolean;
  showContentOnMobile?: boolean;
};

export function AppShell({
  sidebar,
  content,
  showSidebarOnMobile = true,
  showContentOnMobile = true,
}: AppShellProps) {
  const sidebarMobileClass = showSidebarOnMobile ? "block" : "hidden";
  const contentMobileClass = showContentOnMobile ? "block" : "hidden";

  return (
    <div className="flex h-screen">
      <div className={`${sidebarMobileClass} h-full w-full md:block md:w-80 md:shrink-0`}>
        {sidebar}
      </div>
      <main className={`${contentMobileClass} h-full w-full min-w-0 md:block md:flex-1`}>
        {content}
      </main>
    </div>
  );
}
