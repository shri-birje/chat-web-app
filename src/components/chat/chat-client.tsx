"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { formatMessageTimestamp } from "@/lib/format-message-timestamp";
import { AppShell } from "@/components/shared/app-shell";
import { ConversationList, type ConversationListItem } from "@/components/chat/conversation-list";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList, type MessageItem } from "@/components/chat/message-list";
import { Sidebar } from "@/components/chat/sidebar";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { UserSearch } from "@/components/chat/user-search";

type ChatClientProps = {
  selectedConversationId?: string;
};

export function ChatClient({ selectedConversationId }: ChatClientProps) {
  const router = useRouter();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [search, setSearch] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const conversations = useQuery(api.conversations.list);
  const me = useQuery(api.users.me);
  const searchResults = useQuery(
    api.users.searchUsers,
    isCreatingConversation ? { search } : "skip"
  );
  const createConversation = useMutation(api.conversations.create);
  const markRead = useMutation(api.conversations.markRead);
  const heartbeat = useMutation(api.presence.heartbeat);
  const sendMessage = useMutation(api.messages.sendMessage);

  const selectedId = selectedConversationId as Id<"conversations"> | undefined;
  const hasSelectedConversation = !!selectedId;

  // URL selection drives the active conversation and keeps updates realtime.
  const selectedConversation = useQuery(
    api.conversations.open,
    selectedId ? { conversationId: selectedId } : "skip"
  );
  const messageTimeline = useQuery(
    api.messages.list,
    selectedId ? { conversationId: selectedId } : "skip"
  );
  const typingUserIds = useQuery(
    api.typing.listTypingUsers,
    selectedId ? { conversationId: selectedId } : "skip"
  );
  const onlineUsers = useQuery(api.presence.listOnlineUsers);

  useEffect(() => {
    if (!me) return;

    void heartbeat({});
    const intervalId = window.setInterval(() => {
      void heartbeat({});
    }, 5_000);

    return () => window.clearInterval(intervalId);
  }, [heartbeat, me]);

  useEffect(() => {
    if (!selectedId) return;
    void markRead({ conversationId: selectedId });
  }, [markRead, selectedId]);

  const conversationItems = useMemo<ConversationListItem[]>(
    () =>
      (conversations ?? []).map((conversation) => ({
        id: String(conversation._id),
        name: conversation.title,
        lastMessage: conversation.lastMessageText ?? "No messages yet",
        unreadCount: conversation.unreadCount,
      })),
    [conversations]
  );

  const filteredConversationItems = useMemo(() => {
    if (!conversationSearch.trim()) return conversationItems;

    const q = conversationSearch.toLowerCase();
    return conversationItems.filter((conversation) =>
      conversation.name.toLowerCase().includes(q)
    );
  }, [conversationItems, conversationSearch]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of selectedConversation?.members ?? []) {
      map.set(String(member.userId), member.name);
    }
    return map;
  }, [selectedConversation]);

  const messages = useMemo<MessageItem[]>(() => {
    if (!messageTimeline) return [];
    const meId = me ? String(me._id) : null;
    const otherMember = selectedConversation?.members.find(
      (member) => String(member.userId) !== meId
    );

    return messageTimeline.map((message) => {
      const isMine = meId !== null && String(message.senderId) === meId;
      const isSeen = !!otherMember?.lastReadAt && otherMember.lastReadAt >= message.createdAt;

      return {
        id: String(message._id),
        senderName: memberNameById.get(String(message.senderId)) ?? "Unknown",
        body: message.body,
        createdAtLabel: formatMessageTimestamp(message.createdAt),
        isMine,
        status: isMine ? (isSeen ? "seen" : "sent") : undefined,
      };
    });
  }, [me, memberNameById, messageTimeline, selectedConversation]);

  const typingUserNames = useMemo(() => {
    if (!typingUserIds) return [];

    const selfId = me ? String(me._id) : null;
    const names: string[] = [];

    for (const userId of typingUserIds) {
      const id = String(userId);
      if (selfId && id === selfId) continue;

      const name = memberNameById.get(id);
      if (name && !names.includes(name)) {
        names.push(name);
      }
    }

    return names;
  }, [memberNameById, me, typingUserIds]);

  const typingText = useMemo(() => {
    if (typingUserNames.length === 0) return null;
    if (typingUserNames.length === 1) return `${typingUserNames[0]} is typing...`;
    return `${typingUserNames.join(", ")} are typing...`;
  }, [typingUserNames]);

  const onlineUserIdSet = useMemo(() => {
    return new Set((onlineUsers ?? []).map((row) => String(row.userId)));
  }, [onlineUsers]);

  const memberPresence = useMemo(() => {
    if (!selectedConversation) return [];

    const selfId = me ? String(me._id) : null;
    return selectedConversation.members
      .filter((member) => String(member.userId) !== selfId)
      .map((member) => ({
        userId: String(member.userId),
        name: member.name,
        isOnline: onlineUserIdSet.has(String(member.userId)),
      }));
  }, [me, onlineUserIdSet, selectedConversation]);

  const handleSend = (body: string) => {
    if (!selectedId) return;
    void sendMessage({ conversationId: selectedId, body });
  };

  const handleCreateConversation = async (otherUserId: Id<"users">) => {
    setCreateError(null);
    setCreatingUserId(String(otherUserId));

    try {
      const conversationId = await createConversation({ otherUserId });
      setIsCreatingConversation(false);
      setSearch("");
      router.push(`/chat/${conversationId}`);
    } catch {
      setCreateError("Could not start conversation.");
    } finally {
      setCreatingUserId(null);
    }
  };

  const sidebar = (
    <Sidebar>
      <div className="border-b p-2">
        <button
          type="button"
          className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => {
            setCreateError(null);
            setIsCreatingConversation((prev) => !prev);
          }}
        >
          New Conversation
        </button>

        {isCreatingConversation ? (
          <div className="mt-2 space-y-2">
            <UserSearch value={search} onChange={setSearch} />

            <div className="max-h-56 overflow-y-auto rounded-md border">
              {searchResults === undefined ? (
                <div className="p-2 text-sm text-muted-foreground">Loading users...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No users found.</div>
              ) : (
                <ul className="divide-y">
                  {searchResults.map((user) => {
                    const userId = String(user._id);
                    const isPending = creatingUserId === userId;

                    return (
                      <li key={userId}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-muted disabled:opacity-60"
                          disabled={isPending}
                          onClick={() => void handleCreateConversation(user._id)}
                        >
                          <div className="text-sm font-medium">{user.name}</div>
                          {user.email ? (
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {createError ? <div className="text-xs text-destructive">{createError}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="border-b p-2">
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Search conversations..."
          value={conversationSearch}
          onChange={(event) => setConversationSearch(event.target.value)}
        />
      </div>

      <ConversationList
        conversations={filteredConversationItems}
        selectedConversationId={selectedConversationId}
      />
    </Sidebar>
  );

  let content: ReactNode;

  // Empty state only when no conversation is selected.
  if (!selectedId) {
    content = (
      <EmptyState
        title={conversationItems.length === 0 ? "Start a conversation" : "Pick a conversation"}
        description={
          conversationItems.length === 0
            ? "Search for a user to begin chatting."
            : "Select one from the left sidebar to start chatting."
        }
      />
    );
  } else if (selectedConversation === undefined || messageTimeline === undefined) {
    content = (
      <div className="p-4">
        <div className="space-y-3 animate-pulse">
          <div className="h-5 w-40 rounded-md bg-muted" />
          <div className="h-20 rounded-md bg-muted" />
          <div className="h-20 rounded-md bg-muted" />
          <div className="h-20 w-4/5 rounded-md bg-muted" />
        </div>
      </div>
    );
  } else {
    content = (
      <div className="flex h-screen flex-col">
        <header className="border-b px-4 py-3">
          <button
            type="button"
            className="mb-2 inline-flex rounded-md border px-2 py-1 text-xs font-medium md:hidden"
            onClick={() => router.push("/chat")}
          >
            Back
          </button>
          <h1 className="text-sm font-semibold">{selectedConversation.title}</h1>
          {memberPresence.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {memberPresence.map((member) => (
                <div key={member.userId} className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      member.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span>{member.name}</span>
                </div>
              ))}
            </div>
          ) : null}
        </header>
        <div className="min-h-0 flex-1">
          <MessageList messages={messages} />
        </div>
        {typingText ? <TypingIndicator text={typingText} /> : null}
        <div className="border-t">
          <MessageInput onSend={handleSend} conversationId={selectedId} />
        </div>
      </div>
    );
  }

  return (
    <AppShell
      sidebar={sidebar}
      content={content}
      showSidebarOnMobile={!hasSelectedConversation}
      showContentOnMobile={hasSelectedConversation}
    />
  );
}
