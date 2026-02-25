export type MessageItem = {
  id: string;
  senderName: string;
  body: string;
  createdAtLabel: string;
};

type MessageListProps = {
  messages: MessageItem[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">No messages yet.</div>;
  }

  return (
    <div className="space-y-3 p-4">
      {messages.map((message) => (
        <article key={message.id} className="rounded-md border p-3">
          <header className="mb-1 text-xs text-muted-foreground">
            {message.senderName} · {message.createdAtLabel}
          </header>
          <p className="text-sm">{message.body}</p>
        </article>
      ))}
    </div>
  );
}
