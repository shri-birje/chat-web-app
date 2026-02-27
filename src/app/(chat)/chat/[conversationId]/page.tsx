import { ChatClient } from "@/components/chat/chat-client";

type ConversationPageProps = {
  params: {
    conversationId: string;
  };
};

export default function ConversationPage({ params }: ConversationPageProps) {
  return <ChatClient selectedConversationId={params.conversationId} />;
}
