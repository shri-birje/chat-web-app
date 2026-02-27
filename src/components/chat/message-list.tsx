import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/chat/empty-state";

export type MessageItem = {
  id: string;
  senderName: string;
  body: string;
  createdAtLabel: string;
  isMine: boolean;
  status?: "seen" | "sent";
};

type MessageListProps = {
  messages: MessageItem[];
};

export function MessageList({ messages }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {messages.length === 0 ? (
        <EmptyState title="No messages yet" description="Say hello 👋" />
      ) : (
        <div className="space-y-3 p-4">
          {messages.map((message) => (
            <article key={message.id} className="rounded-md border p-3">
              <header className="mb-1 text-xs text-muted-foreground">
                {message.senderName} · {message.createdAtLabel}
              </header>
              <p className="text-sm">{message.body}</p>
              {message.isMine && message.status ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {message.status === "seen" ? "✓ Seen" : "✓ Sent"}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
