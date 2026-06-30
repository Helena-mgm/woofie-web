"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Conversation, Message, WSMessage } from "@/shared/types/chat";
import { apiDelete, apiGet, apiPatch, apiPost, tokenManager } from "@/shared/lib/api";
import { chatWS } from "@/infrastructure/services/chatWebSocket";
import { sendBotMessage } from "@/infrastructure/services/botService";

type MessagesState = {
  conversations: Conversation[];
  messages: Record<number, Message[]>;
  loading: boolean;
  botTyping: boolean;
};

const initialState: MessagesState = {
  conversations: [],
  messages: {},
  loading: true,
  botTyping: false,
};

const DRAFT_BOT_CONVERSATION_ID = -1;

type EditMessageResponse = {
  message: {
    id: number;
    conversationId: number;
    senderId: number | null;
    content: string;
    type: Message["type"];
    createdAt: string;
    isRead: boolean;
  };
  botMessage?: {
    id: number;
    conversationId: number;
    senderId: number | null;
    content: string;
    type: Message["type"];
    createdAt: string;
    isRead: boolean;
  } | null;
};

export function useMessages(userId?: number) {
  const [state, setState] = useState(initialState);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(DRAFT_BOT_CONVERSATION_ID);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await apiGet("/api/conversations");
      const data = response.ok && Array.isArray(response.data) ? (response.data as Conversation[]) : [];
      setState((prev) => ({ ...prev, conversations: data, loading: false }));
      
  // Keep draft selected by default; only fallback if really no active id
  setActiveConversationId((prev) => prev ?? DRAFT_BOT_CONVERSATION_ID);
    } catch (error) {
      console.error("[messages] load conversations failed", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    void loadConversations();

    const token = tokenManager.get();
    if (token) {
      chatWS.connect(token);
    }

    const unsubscribe = chatWS.subscribe((payload: WSMessage) => {
      if (payload.type === "message") {
        setState((prev) => {
          const existing = prev.messages[payload.data.conversationId] ?? [];
          // Dédoublonnage : évite les doublons entre WS et polling
          if (existing.some((m) => m.id === payload.data.id)) return prev;
          return {
            ...prev,
            messages: {
              ...prev.messages,
              [payload.data.conversationId]: [...existing, payload.data],
            },
          };
        });
      }
    });

    return () => {
      unsubscribe();
      chatWS.disconnect();
    };
  }, [userId, loadConversations]);

  const loadMessages = useCallback(async (conversationId: number) => {
    const response = await apiGet(`/api/conversations/${conversationId}/messages?limit=50`);
    if (!response.ok || !Array.isArray(response.data)) return;
    setState((prev) => ({
      ...prev,
      messages: { ...prev.messages, [conversationId]: response.data as Message[] },
    }));
  }, []);

  // Polling léger : fusionne les nouveaux messages sans écraser les messages en cours d'envoi
  const pollMessages = useCallback(async (conversationId: number) => {
    const response = await apiGet(`/api/conversations/${conversationId}/messages?limit=50`);
    if (!response.ok || !Array.isArray(response.data)) return;
    const incoming = response.data as Message[];
    setState((prev) => {
      const current = prev.messages[conversationId] ?? [];
      // Garde les messages temporaires (id < 0) en attente de confirmation
      const pending = current.filter((m) => m.id < 0);
      return {
        ...prev,
        messages: { ...prev.messages, [conversationId]: [...incoming, ...pending] },
      };
    });
  }, []);

  // Ref pour éviter les captures obsolètes dans l'intervalle de polling
  const activeIdRef = useRef(activeConversationId);
  useEffect(() => { activeIdRef.current = activeConversationId; }, [activeConversationId]);

  // Polling toutes les 3s sur la conversation active (le WS backend n'émet pas encore)
  useEffect(() => {
    if (!activeConversationId || activeConversationId === DRAFT_BOT_CONVERSATION_ID) return;
    const timer = setInterval(() => {
      const id = activeIdRef.current;
      if (!id || id === DRAFT_BOT_CONVERSATION_ID) return;
      void pollMessages(id);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeConversationId, pollMessages]);

  // Defensive: whenever the active conversation changes to a real one,
  // make sure its messages are loaded (covers edge cases like last conv after deletion).
  useEffect(() => {
    if (
      activeConversationId &&
      activeConversationId !== DRAFT_BOT_CONVERSATION_ID &&
      !state.messages[activeConversationId]
    ) {
      void loadMessages(activeConversationId);
    }
  }, [activeConversationId, state.messages, loadMessages]);

  const sendMessage = useCallback(
    async (conversationId: number, content: string) => {
      let isBot = false;
      const conversation = state.conversations.find((conv) => conv.id === conversationId);
      if (conversation?.type === "bot" || conversationId === DRAFT_BOT_CONVERSATION_ID) {
        isBot = true;
      }

      if (isBot) {
        // Show user message immediately (optimistic)
        const tempId = Date.now();
        const temp: Message = {
          id: tempId,
          conversationId,
          senderId: userId ?? 0,
          content,
          type: "text",
          createdAt: new Date(),
          isRead: true,
        };
        setState((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [conversationId]: [...(prev.messages[conversationId] ?? []), temp],
          },
          botTyping: true,
        }));
        
        const botReply = await sendBotMessage(
          conversationId === DRAFT_BOT_CONVERSATION_ID ? null : conversationId,
          content
        );

        if (!botReply) {
          setState((prev) => ({ ...prev, botTyping: false }));
          return;
        }

        const actualConvId = botReply.conversationId || conversationId;

        // Keep UI responsive immediately, then hard-sync from backend for consistency.
        setState((prev) => {
          const existing = (prev.messages[conversationId] ?? []).filter((m) => m.id !== tempId);
          const userMsg: Message = { ...temp, id: tempId + 1, conversationId: actualConvId };
          const botMsg: Message = {
            id: botReply.id,
            conversationId: actualConvId,
            senderId: 0,
            content: botReply.content,
            type: "bot",
            createdAt: new Date(botReply.createdAt),
            isRead: true,
          };

          const updatedMsgs = [...existing, userMsg, botMsg];
          const nextMessages = { ...prev.messages };

          if (conversationId === DRAFT_BOT_CONVERSATION_ID) {
            delete nextMessages[DRAFT_BOT_CONVERSATION_ID];
            nextMessages[actualConvId] = updatedMsgs;
          } else {
            nextMessages[conversationId] = updatedMsgs;
          }

          return {
            ...prev,
            messages: nextMessages,
            botTyping: false,
          };
        });

        if (conversationId === DRAFT_BOT_CONVERSATION_ID) {
          await loadConversations();
          setActiveConversationId(actualConvId);
        }

        // Ensure final state comes from backend (prevents stale UI until manual refresh)
        await loadMessages(actualConvId);
        return;
      }

      // ── Conversation normale (non-bot) ──────────────────────────────────
      // 1. Affichage optimiste immédiat avec un ID temporaire négatif
      const tempId = -Date.now();
      const tempMessage: Message = {
        id: tempId,
        conversationId,
        senderId: userId ?? 0,
        content,
        type: "text",
        createdAt: new Date(),
        isRead: true,
      };

      setState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [conversationId]: [...(prev.messages[conversationId] ?? []), tempMessage],
        },
      }));

      // 2. Envoi réel au serveur
      const res = await apiPost(`/api/conversations/${conversationId}/messages`, {
        content,
        type: "text",
      });

      if (res.ok && res.data) {
        // 3a. Remplace le message temporaire par le vrai (avec l'ID serveur)
        const { id: realId, createdAt } = res.data as { id: number; createdAt: string };
        setState((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [conversationId]: (prev.messages[conversationId] ?? []).map((m) =>
              m.id === tempId
                ? { ...tempMessage, id: realId, createdAt: new Date(createdAt) }
                : m
            ),
          },
        }));
      } else {
        // 3b. Rollback si erreur serveur
        setState((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [conversationId]: (prev.messages[conversationId] ?? []).filter(
              (m) => m.id !== tempId
            ),
          },
        }));
      }
    },
    [state.conversations, userId, loadMessages, loadConversations]
  );

  const selectConversation = useCallback(
    (conversationId: number) => {
      setActiveConversationId(conversationId);
      if (conversationId === DRAFT_BOT_CONVERSATION_ID) return;
      void loadMessages(conversationId);
    },
    [loadMessages]
  );

  const editMessage = useCallback(
    async (conversationId: number, messageId: number, content: string) => {
      setState((prev) => ({ ...prev, botTyping: true }));

      // Ollama can take up to 2 min to regenerate — use a 120s timeout
      const response = await apiPatch(
        `/api/conversations/${conversationId}/messages/${messageId}`,
        { content },
        120_000
      );

      if (!response.ok || !response.data) {
        setState((prev) => ({ ...prev, botTyping: false }));
        return false;
      }

      const payload = response.data as EditMessageResponse;
      const editedMessage: Message = {
        id: payload.message.id,
        conversationId: payload.message.conversationId,
        senderId: payload.message.senderId ?? 0,
        content: payload.message.content,
        type: payload.message.type,
        createdAt: new Date(payload.message.createdAt),
        isRead: payload.message.isRead,
      };

      const regeneratedBotMessage: Message | null = payload.botMessage
        ? {
            id: payload.botMessage.id,
            conversationId: payload.botMessage.conversationId,
            senderId: payload.botMessage.senderId ?? 0,
            content: payload.botMessage.content,
            type: payload.botMessage.type,
            createdAt: new Date(payload.botMessage.createdAt),
            isRead: payload.botMessage.isRead,
          }
        : null;

      setState((prev) => {
        const current = prev.messages[conversationId] ?? [];
        const userIdx = current.findIndex((m) => m.id === messageId);
        if (userIdx === -1) return prev;

        const next = [...current];
        next[userIdx] = editedMessage;

        if (regeneratedBotMessage) {
          const botIdx = next.findIndex((m, idx) => idx > userIdx && m.type === "bot");
          if (botIdx !== -1) {
            next[botIdx] = regeneratedBotMessage;
          } else {
            next.push(regeneratedBotMessage);
          }
        }

        return {
          ...prev,
          messages: {
            ...prev.messages,
            [conversationId]: next,
          },
          botTyping: false,
        };
      });

      // Hard refresh from backend so regenerated sequence appears instantly without page refresh
      await loadMessages(conversationId);

      return true;
    },
    [loadMessages]
  );

  const deleteConversation = useCallback(
    async (conversationId: number) => {
      if (conversationId === DRAFT_BOT_CONVERSATION_ID) {
        setActiveConversationId(DRAFT_BOT_CONVERSATION_ID);
        return true;
      }

      const response = await apiDelete(`/api/conversations/${conversationId}`);
      if (!response.ok) return false;

      setState((prev) => {
        const nextConversations = prev.conversations.filter((c) => c.id !== conversationId);
        const nextMessages = { ...prev.messages };
        delete nextMessages[conversationId];
        return {
          ...prev,
          conversations: nextConversations,
          messages: nextMessages,
        };
      });

      setActiveConversationId((prev) => {
        if (prev !== conversationId) return prev;
        return DRAFT_BOT_CONVERSATION_ID;
      });

      return true;
    },
    []
  );

  const activeMessages = useMemo(
    () => (activeConversationId ? state.messages[activeConversationId] ?? [] : []),
    [state.messages, activeConversationId]
  );

  const activeConversation = useMemo(() => {
    if (activeConversationId === DRAFT_BOT_CONVERSATION_ID) {
      return {
        id: DRAFT_BOT_CONVERSATION_ID,
        type: "bot",
        name: "Nouvelle discussion IA",
        participants: [],
        unreadCount: 0,
        createdAt: new Date(),
      } as Conversation;
    }

    return state.conversations.find((conv) => conv.id === activeConversationId) ?? null;
  }, [state.conversations, activeConversationId]);

  return {
    conversations: state.conversations,
    activeConversation,
    activeConversationId,
    messages: activeMessages,
    loading: state.loading,
    botTyping: state.botTyping,
    selectConversation,
    sendMessage,
    editMessage,
    deleteConversation,
    loadMessages,
  };
}
