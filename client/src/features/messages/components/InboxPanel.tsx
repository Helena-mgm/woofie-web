"use client";

import { useState } from "react";
import type { Conversation } from "@/shared/types/chat";
import { cn } from "@/shared/lib/cn";
import { PenSquare, X, Bot, MessageCircle, Users } from "lucide-react";

type InboxPanelProps = {
  conversations: Conversation[];
  activeId: number | null;
  loading: boolean;
  onSelect: (conversationId: number) => void;
  onDelete?: (conversationId: number) => Promise<boolean> | boolean;
};

function ConvRow({
  id,
  icon,
  name,
  lastMessage,
  unreadCount,
  isActive,
  isDraft,
  onSelect,
  onDelete,
}: {
  id: number;
  icon: React.ReactNode;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
  isActive: boolean;
  isDraft?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors",
          isActive ? "bg-[#FFF0E0]" : "hover:bg-[#FDF7F2]"
        )}
        onClick={onSelect}
      >
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#D2691E]" />
        )}
        <div
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            isDraft
              ? "bg-[#D2691E]/10 border border-dashed border-[#D2691E]/40"
              : "bg-[#F5EDE1]"
          )}
        >
          {icon}
          {!!unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D2691E] text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isActive ? "text-[#3E2A1B]" : "text-[#4A3020]",
              unreadCount ? "font-bold" : ""
            )}
          >
            {name}
          </p>
          {lastMessage ? (
            <p className={cn(
              "truncate text-xs",
              unreadCount ? "font-semibold text-[#7A4020]" : "text-[#A07050]"
            )}>
              {lastMessage}
            </p>
          ) : (
            <p className="truncate text-xs text-[#A07050]">
              {isDraft ? "En attente de votre message…" : "Démarrer la conversation"}
            </p>
          )}
        </div>
        {onDelete && !isDraft && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            aria-label="Supprimer"
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all",
              "sm:opacity-0 sm:group-hover:opacity-100",
              "text-[#C07040] hover:bg-[#FDDCC4] hover:text-[#B05020]"
            )}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-base font-semibold text-[#3E2A1B]">Supprimer cette conversation ?</p>
            <p className="mt-1.5 text-sm text-[#A07050]">
              Tous les messages seront définitivement supprimés. Cette action est irréversible.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#A07050] hover:bg-[#F5EDE1] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); onDelete?.(); }}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C09070]">
      {children}
    </p>
  );
}

export function InboxPanel({ conversations, activeId, loading, onSelect, onDelete }: InboxPanelProps) {
  const bots = conversations.filter((c) => c.type === "bot");
  const groups = conversations.filter((c) => c.type === "group");
  const directs = conversations.filter((c) => c.type === "direct");

  const lastMsgText = (conv: Conversation) => {
    if (!conv.lastMessage) return undefined;
    const lm = conv.lastMessage;
    if (lm.type === "system") return `ℹ️ ${lm.content}`;
    return lm.content;
  };

  return (
    <aside className="flex w-full flex-col overflow-hidden bg-white lg:w-72 lg:border-r lg:border-[#EDE0D0]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EDE0D0] px-4 py-4">
        <h1 className="text-lg font-bold text-[#3E2A1B]">Messages</h1>
        <button
          type="button"
          onClick={() => onSelect(-1)}
          aria-label="Nouvelle conversation IA"
          title="Nouvelle conversation WoofieBot"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#D2691E] hover:bg-[#FFF0E0] transition-colors"
        >
          <PenSquare size={17} strokeWidth={2} />
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        <SectionLabel>WoofieBot</SectionLabel>

        {activeId === -1 && (
          <ConvRow
            id={-1}
            icon={<Bot size={16} className="text-[#D2691E]" />}
            name="Nouvelle discussion"
            isActive
            isDraft
          />
        )}

        {loading && bots.length === 0 ? (
          <div className="px-4 py-3 text-xs text-[#B08060]">Chargement…</div>
        ) : bots.length === 0 && activeId !== -1 ? (
          <div className="px-4 py-3 text-xs text-[#B08060]">Aucune conversation IA.</div>
        ) : (
          bots.map((conv) => (
            <ConvRow
              key={conv.id}
              id={conv.id}
              icon={<Bot size={16} className="text-[#D2691E]" />}
              name={conv.name ?? "WoofieBot"}
              lastMessage={lastMsgText(conv)}
              unreadCount={conv.unreadCount}
              isActive={activeId === conv.id}
              onSelect={() => onSelect(conv.id)}
              onDelete={onDelete ? () => onDelete(conv.id) : undefined}
            />
          ))
        )}

        {directs.length > 0 && (
          <>
            <SectionLabel>Messages privés</SectionLabel>
            {directs.map((conv) => {
              const other = conv.participants.find((p) => p.id !== activeId) ?? conv.participants[0];
              return (
                <ConvRow
                  key={conv.id}
                  id={conv.id}
                  icon={<MessageCircle size={16} className="text-[#A0522D]" />}
                  name={other?.name ?? conv.name ?? "Conversation"}
                  lastMessage={lastMsgText(conv)}
                  unreadCount={conv.unreadCount}
                  isActive={activeId === conv.id}
                  onSelect={() => onSelect(conv.id)}
                  onDelete={onDelete ? () => onDelete(conv.id) : undefined}
                />
              );
            })}
          </>
        )}

        {groups.length > 0 && (
          <>
            <SectionLabel>Groupes</SectionLabel>
            {groups.map((conv) => (
              <ConvRow
                key={conv.id}
                id={conv.id}
                icon={<Users size={16} className="text-[#A0522D]" />}
                name={conv.name ?? "Groupe"}
                lastMessage={lastMsgText(conv)}
                unreadCount={conv.unreadCount}
                isActive={activeId === conv.id}
                onSelect={() => onSelect(conv.id)}
                onDelete={onDelete ? () => onDelete(conv.id) : undefined}
              />
            ))}
          </>
        )}

        {!loading && conversations.length === 0 && activeId !== -1 && (
          <div className="px-4 py-6 text-center text-xs text-[#B08060]">
            Aucune conversation. Commencez à discuter avec WoofieBot !
          </div>
        )}
      </div>
    </aside>
  );
}

export default InboxPanel;
