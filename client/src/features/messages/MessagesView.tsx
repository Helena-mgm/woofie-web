"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useMessages } from "./hooks/useMessages";
import { cn } from "@/shared/lib/cn";

const InboxPanel = dynamic(() => import("./components/InboxPanel"), {
  ssr: false,
  loading: () => (
    <div className="w-72 shrink-0 bg-white border-r border-[#F0E6D8] animate-pulse" />
  ),
});

const ThreadView = dynamic(() => import("./components/ThreadView"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-[#FAFAF8] animate-pulse" />,
});

export function MessagesView() {
  const { user } = useAuth();
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    loading,
    botTyping,
    selectConversation,
    sendMessage,
    editMessage,
    deleteConversation,
  } = useMessages(user?.id);

  // Ouvrir automatiquement la conversation demandée (ex: depuis /services)
  useEffect(() => {
    if (loading) return;
    const stored = sessionStorage.getItem('openConversation');
    if (!stored) return;
    const id = parseInt(stored, 10);
    sessionStorage.removeItem('openConversation');
    if (!isNaN(id)) {
      selectConversation(id);
      setMobileView('thread');
    }
  }, [loading, selectConversation]);

  const handleSelect = (id: number) => {
    selectConversation(id);
    setMobileView("thread");
  };

  const handleDelete = async (id: number) => {
    const ok = await deleteConversation(id);
    if (ok) setMobileView("list");
    return ok;
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-[#FAF6F1]">
      {/* Sidebar — full screen on mobile (list), fixed w-72 on desktop */}
      <div
        className={cn(
          // Desktop (lg+): always shown, fixed width, no grow
          "lg:flex lg:w-72 lg:shrink-0 lg:grow-0 lg:flex-col",
          // Mobile/tablet: full-width when list, hidden when thread
          mobileView === "list" ? "flex w-full flex-col" : "hidden"
        )}
      >
        <InboxPanel
          conversations={conversations}
          activeId={activeConversationId}
          loading={loading}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </div>

      {/* Thread — full screen on mobile (thread), flex-1 on desktop */}
      <div
        className={cn(
          // Desktop (lg+): always shown, takes remaining space
          "lg:flex lg:flex-1 lg:min-w-0 lg:flex-col lg:min-h-0",
          // Mobile/tablet: shown when thread, hidden when list
          mobileView === "thread" ? "flex flex-1 min-w-0 flex-col min-h-0" : "hidden"
        )}
      >
        <ThreadView
          conversation={activeConversation}
          messages={messages}
          loading={loading}
          botTyping={botTyping}
          ownId={user?.id}
          onBack={() => setMobileView("list")}
          onDeleteConversation={async () => {
            if (!activeConversationId) return;
            await deleteConversation(activeConversationId);
            setMobileView("list");
          }}
          onEditMessage={async (messageId: number, content: string) => {
            if (!activeConversationId) return false;
            return editMessage(activeConversationId, messageId, content);
          }}
          onSend={(content) => {
            if (!activeConversationId) return;
            return sendMessage(activeConversationId, content);
          }}
        />
      </div>
    </div>
  );
}
