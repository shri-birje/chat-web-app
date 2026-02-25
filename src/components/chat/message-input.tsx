"use client";

import { FormEvent, useState } from "react";

type MessageInputProps = {
  onSend: (message: string) => void;
};

export function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form className="flex gap-2 p-4" onSubmit={handleSubmit}>
      <input
        className="flex-1 rounded-md border px-3 py-2"
        placeholder="Type a message"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" type="submit">
        Send
      </button>
    </form>
  );
}
