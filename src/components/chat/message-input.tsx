"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

type MessageInputProps = {
  onSend: (message: string) => void;
  conversationId?: Id<"conversations">;
  disabled?: boolean;
};

export function MessageInput({ onSend, conversationId, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState("");
  const setTyping = useMutation(api.typing.setTyping);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!conversationId || disabled) return;
    inputRef.current?.focus();
  }, [conversationId, disabled]);

  useEffect(() => {
    if (!conversationId) return;
    if (!value.trim()) return;

    const timeoutId = window.setTimeout(() => {
      void setTyping({ conversationId });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [conversationId, setTyping, value]);

  const submitCurrentMessage = () => {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitCurrentMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    if (event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;

    event.preventDefault();
    submitCurrentMessage();
  };

  const sendDisabled = disabled || !value.trim();

  return (
    <form className="flex items-end gap-2 p-4" onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        className="min-h-[44px] flex-1 resize-none rounded-md border px-3 py-2"
        placeholder="Type a message"
        value={value}
        disabled={disabled}
        rows={2}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={sendDisabled}
      >
        Send
      </button>
    </form>
  );
}
