"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useMessages } from "./hooks/useMessages";

const InboxPanel = dynamic(() => import("./components/InboxPanel"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-3xl bg-white/70 animate-pulse" />,
});

const ThreadView = dynamic(() => import("./components/ThreadView"), {
  ssr: false,
  loading: () => <ThreadSkeleton />,
});

export function MessagesView() {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    loading,
    botTyping,
    selectConversation,
    sendMessage,
  } = useMessages(user?.id);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, selectConversation]);

  return (
    <div className="grid min-h-[70vh] gap-6 rounded-[36px] bg-white/80 p-6 shadow-[0_20px_60px_-30px_rgba(139,69,19,0.35)] backdrop-blur lg:grid-cols-[320px_1fr]">
      <InboxPanel
        conversations={conversations}
        activeId={activeConversationId}
        loading={loading}
        onSelect={selectConversation}
      />
      <ThreadView
        conversation={activeConversation}
        messages={messages}
        loading={loading}
        botTyping={botTyping}
        ownId={user?.id}
        onSend={(content) => {
          if (!activeConversationId) return;
          return sendMessage(activeConversationId, content);
        }}
      />
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-20 rounded-3xl bg-white/70 animate-pulse" />
      <div className="h-[50vh] rounded-3xl bg-white/60 animate-pulse" />
      <div className="h-28 rounded-3xl bg-white/70 animate-pulse" />
    </div>
  );
}
