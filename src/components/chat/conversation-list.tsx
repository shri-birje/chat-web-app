import Link from "next/link";
import { EmptyState } from "@/components/chat/empty-state";

export type ConversationListItem = {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
};

type ConversationListProps = {
  conversations: ConversationListItem[];
  selectedConversationId?: string;
};

export function ConversationList({ conversations, selectedConversationId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        title="Start a conversation"
        description="Search for a user to begin chatting."
      />
    );
  }

  return (
    <ul className="space-y-1 p-2">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <Link
            href={`/chat/${conversation.id}`}
            className={`block rounded-md p-2 hover:bg-muted ${
              selectedConversationId === conversation.id ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">{conversation.name}</div>
              {(conversation.unreadCount ?? 0) > 0 ? (
                <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              {conversation.lastMessage?.trim() ? conversation.lastMessage : "No messages yet"}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
