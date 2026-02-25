export type ConversationListItem = {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
};

type ConversationListProps = {
  conversations: ConversationListItem[];
};

export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>;
  }

  return (
    <ul className="space-y-1 p-2">
      {conversations.map((conversation) => (
        <li key={conversation.id} className="rounded-md p-2 hover:bg-muted">
          <div className="font-medium">{conversation.name}</div>
          <div className="text-sm text-muted-foreground">{conversation.lastMessage ?? "No messages yet"}</div>
        </li>
      ))}
    </ul>
  );
}
