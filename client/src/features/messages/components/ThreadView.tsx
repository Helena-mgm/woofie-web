"use client";

import { useEffect, useMemo, useRef, useState } from "react";import type { Conversation, Message } from "@/shared/types/chat";
import { MessageBubble } from "./thread/MessageBubble";
import { Composer } from "./thread/Composer";
import { Trash2, Sparkles, ChevronLeft } from "lucide-react";

type ThreadViewProps = {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  botTyping: boolean;
  onSend: (content: string) => Promise<void> | void;
  onEditMessage?: (messageId: number, content: string) => Promise<boolean> | boolean;
  onDeleteConversation?: () => Promise<void> | void;
  onBack?: () => void;
  ownId?: number;
};

export function ThreadView({
  conversation,
  messages,
  loading,
  botTyping,
  onSend,
  onEditMessage,
  onDeleteConversation,
  onBack,
  ownId,
}: ThreadViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const headerTitle = useMemo(() => {
    if (!conversation) return "Sélectionnez une conversation";
    if (conversation.type === "bot") return "WoofieBot";
    return conversation.name ?? "Conversation privée";
  }, [conversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, botTyping]);

  if (!conversation) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center bg-[#FAF6F1] text-[#A0522D]">
        <p className="text-6xl">🐾</p>
        <p className="mt-4 text-sm font-semibold text-[#8B6040]">
          Choisissez une conversation pour commencer
        </p>
      </section>
    );
  }

  const isBot = conversation.type === "bot";

  return (
    <section className="flex flex-1 min-w-0 flex-col bg-[#FAF6F1]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#EDE0D0] bg-white px-3 py-3.5 sm:gap-3 sm:px-6">
        {/* Back button — mobile only */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#D2691E] hover:bg-[#FFF0E0] transition-colors sm:hidden"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        )}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D2691E] text-white shadow-sm">
          {isBot ? <Sparkles size={16} /> : <span className="text-sm">💬</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#3E2A1B]">{headerTitle}</p>
          <p className="text-xs text-[#A07050]">
            {isBot ? "Assistant IA canin · WoofieBot" : "Conversation active"}
          </p>
        </div>
        {conversation.id !== -1 && onDeleteConversation && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Supprimer la conversation"
            title="Supprimer cette conversation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#C07040] transition-colors hover:bg-[#FDDCC4] hover:text-[#B05020]"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
        {loading && messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#A0522D]">
            Chargement…
          </div>
        ) : messages.length === 0 && isBot ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-[#A0522D]">
            <p className="text-5xl">🧠</p>
            <p className="font-semibold text-[#3E2A1B]">Posez votre première question à WoofieBot !</p>
            <p className="text-sm text-[#8B6040]">Santé, comportement, races, éducation…</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.type !== "bot" && message.senderId === ownId;
            const canEdit = isBot && isOwn && message.type === "text" && conversation.id !== -1;
            const isEditing = editingMessageId === message.id;

            return (
              <div key={message.id} className="space-y-1">
                <MessageBubble message={message} isOwn={isOwn} />

                {canEdit && !isEditing && onEditMessage && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessageId(message.id);
                        setEditingValue(message.content);
                      }}
                      className="text-[11px] font-medium text-[#B08060] hover:text-[#D2691E] transition-colors"
                    >
                      Modifier
                    </button>
                  </div>
                )}

                {canEdit && isEditing && onEditMessage && (
                  <div className="ml-auto w-full max-w-[75%] rounded-2xl border border-[#EDE0D0] bg-white p-3 shadow-sm">
                    <textarea
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      disabled={savingEdit}
                      className="min-h-20 w-full resize-y rounded-xl border border-[#EDE0D0] bg-[#FAFAF8] p-2.5 text-sm text-[#3E2A1B] outline-none transition focus:border-[#D2691E]"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (savingEdit) return;
                          setEditingMessageId(null);
                          setEditingValue("");
                        }}
                        disabled={savingEdit}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#A07050] hover:bg-[#F5EDE1] transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSavingEdit(true);
                          try {
                            const ok = await onEditMessage(message.id, editingValue.trim());
                            if (ok) {
                              setEditingMessageId(null);
                              setEditingValue("");
                            }
                          } finally {
                            setSavingEdit(false);
                          }
                        }}
                        disabled={!editingValue.trim() || savingEdit}
                        className="rounded-full bg-[#D2691E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
                      >
                        {savingEdit ? "Régénération…" : "Enregistrer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {botTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm text-[#A07050] shadow-sm border border-[#EDE0D0]">
              <Sparkles size={13} className="text-[#D2691E]" />
              <span className="font-medium text-[#8B5030]">WoofieBot</span>
              <span className="text-[#B08060]">répond</span>
              <span className="flex gap-0.5 ml-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D2691E] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D2691E] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D2691E] animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[#EDE0D0] bg-white px-3 py-2.5 sm:px-4 sm:py-3">
        <Composer onSend={onSend} />
      </div>

      {/* Confirm delete modal */}
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
                onClick={async () => {
                  setConfirmDelete(false);
                  await onDeleteConversation?.();
                }}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ThreadView;
