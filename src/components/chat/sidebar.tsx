type SidebarProps = {
  title?: string;
};

export function Sidebar({ title = "Conversations" }: SidebarProps) {
  return <aside className="h-full border-r p-4">{title}</aside>;
}
