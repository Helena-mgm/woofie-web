"use client";

import type { Conversation } from "@/shared/types/chat";
import { cn } from "@/shared/lib/cn";

const badges: Record<string, string> = {
  bot: "bg-[#FFF5E6] text-[#8B4513]",
  group: "bg-[#FFE0B5] text-[#5C2A0C]",
  direct: "bg-[#E7F5FF] text-[#1D4E89]",
};

const typeLabels: Record<string, string> = {
  bot: "WoofieBot",
  group: "Groupe",
  direct: "Privé",
};

type InboxPanelProps = {
  conversations: Conversation[];
  activeId: number | null;
  loading: boolean;
  onSelect: (conversationId: number) => void;
};

export function InboxPanel({ conversations, activeId, loading, onSelect }: InboxPanelProps) {
  return (
    <aside className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]">Boîte de réception</p>
        <h2 className="text-lg font-bold text-[#3E2A1B]">Conversations</h2>
      </header>
      <div className="rounded-3xl border border-[#F1E5D4] bg-white/90">
        {loading && conversations.length === 0 ? (
          <div className="p-6 text-sm text-[#A0522D]">Chargement de la meute…</div>
        ) : (
          <ul className="divide-y divide-[#F6EDE0]">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    "w-full p-4 text-left transition hover:bg-[#FFF9F1]",
                    activeId === conversation.id ? "bg-[#FFF0E0]" : ""
                  )}
                >
                  <p className="flex items-center justify-between text-sm font-semibold text-[#3E2A1B]">
                    <span>{conversation.name ?? typeLabels[conversation.type ?? ""] ?? "Conversation"}</span>
                    {conversation.type && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          badges[conversation.type] ?? "bg-[#E0F2F1] text-[#00695C]"
                        )}
                      >
                        {typeLabels[conversation.type] ?? conversation.type}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#A0522D]">
                    {conversation.unreadCount > 0
                      ? `${conversation.unreadCount} non lu${conversation.unreadCount > 1 ? 's' : ''}`
                      : "Tout est lu"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default InboxPanel;
