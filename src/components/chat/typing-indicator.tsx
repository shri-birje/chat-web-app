type TypingIndicatorProps = {
  text?: string;
};

export function TypingIndicator({ text = "User is typing..." }: TypingIndicatorProps) {
  return <div className="px-4 pb-2 text-xs text-muted-foreground">{text}</div>;
}
