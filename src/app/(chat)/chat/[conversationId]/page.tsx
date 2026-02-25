type ConversationPageProps = {
  params: {
    conversationId: string;
  };
};

export default function ConversationPage({ params }: ConversationPageProps) {
  return <div className="p-6">Conversation: {params.conversationId}</div>;
}
