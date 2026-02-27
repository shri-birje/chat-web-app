import type { ReactNode } from "react";

type SidebarProps = {
  title?: string;
  children?: ReactNode;
};

export function Sidebar({ title = "Conversations", children }: SidebarProps) {
  return (
    <aside className="h-full md:border-r">
      <div className="border-b px-4 py-3 font-semibold">{title}</div>
      <div className="h-[calc(100%-49px)] overflow-y-auto">{children}</div>
    </aside>
  );
}
