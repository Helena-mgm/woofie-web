"use client";

import { useMemo } from "react";
import type { Conversation, Message } from "@/shared/types/chat";
import { Button } from "@/shared/ui/button";
import { MessageBubble } from "./thread/MessageBubble";
import { Composer } from "./thread/Composer";

type ThreadViewProps = {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  botTyping: boolean;
  onSend: (content: string) => Promise<void> | void;
  ownId?: number;
};

export function ThreadView({ conversation, messages, loading, botTyping, onSend, ownId }: ThreadViewProps) {
  const headerTitle = useMemo(() => {
    if (!conversation) return "Sélectionnez une conversation";
    if (conversation.type === "bot") return "WoofieBot";
    return conversation.name ?? "Conversation privée";
  }, [conversation]);

  if (!conversation) {
    return (
      <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E7D9C7] p-12 text-center text-[#A0522D]">
        <p className="text-6xl">🐾</p>
        <p className="mt-4 text-sm font-semibold">Choisissez une conversation pour commencer</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between rounded-3xl bg-[#FFF5E6] px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#A0522D]">Conversation active</p>
          <h2 className="text-lg font-semibold text-[#3E2A1B]">{headerTitle}</h2>
        </div>
        {conversation.type === "bot" && (
          <Button size="sm" variant="secondary" onClick={() => onSend("Peux-tu m’aider ?")}>Parler à WoofieBot</Button>
        )}
      </header>
      <div className="flex-1 overflow-hidden rounded-3xl border border-[#F1E5D4] bg-white">
        <div className="flex h-[50vh] flex-col gap-3 overflow-y-auto p-6">
          {loading && messages.length === 0 ? (
            <p className="text-sm text-[#A0522D]">Chargement des messages…</p>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} isOwn={message.senderId === ownId} />
            ))
          )}
          {botTyping && <p className="text-xs text-[#A0522D]">WoofieBot est en train d’écrire…</p>}
        </div>
      </div>
      <Composer onSend={onSend} />
    </section>
  );
}

export default ThreadView;
