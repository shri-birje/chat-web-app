import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  content: ReactNode;
};

export function AppShell({ sidebar, content }: AppShellProps) {
  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-[320px_1fr]">
      <div>{sidebar}</div>
      <main>{content}</main>
    </div>
  );
}
