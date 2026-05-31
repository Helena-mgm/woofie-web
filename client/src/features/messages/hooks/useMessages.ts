"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Conversation, Message, WSMessage } from "@/shared/types/chat";
import { apiGet, apiPost, tokenManager } from "@/shared/lib/api-v2";
import { chatWS } from "@/infrastructure/services/chatWebSocket";
import { getBotConversation, sendBotMessage } from "@/infrastructure/services/botService";

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

export function useMessages(userId?: number) {
  const [state, setState] = useState(initialState);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const botConv = await getBotConversation();
      const response = await apiGet("/api/conversations");
      const data = response.ok && Array.isArray(response.data) ? (response.data as Conversation[]) : [];
      const regular = data.filter((conv) => conv.type !== "bot");
      const conversations = botConv
        ? [{ id: botConv.id, type: "bot", name: botConv.name, participants: [], unreadCount: 0, createdAt: new Date() }, ...regular]
        : regular;
      setState((prev) => ({ ...prev, conversations, loading: false }));
      setActiveConversationId((prev) => prev ?? conversations[0]?.id ?? null);
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
        setState((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [payload.data.conversationId]: [
              ...(prev.messages[payload.data.conversationId] ?? []),
              payload.data,
            ],
          },
        }));
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

  const sendMessage = useCallback(
    async (conversationId: number, content: string) => {
      const conversation = state.conversations.find((conv) => conv.id === conversationId);
      if (!conversation) return;

      if (conversation.type === "bot") {
        const temp: Message = {
          id: Date.now(),
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
        await sendBotMessage(conversationId, content);
        await loadMessages(conversationId);
        setState((prev) => ({ ...prev, botTyping: false }));
        return;
      }

      await apiPost(`/api/conversations/${conversationId}/messages`, {
        content,
        type: "text",
      });
      await loadMessages(conversationId);
    },
    [state.conversations, userId, loadMessages]
  );

  const selectConversation = useCallback(
    (conversationId: number) => {
      setActiveConversationId(conversationId);
      void loadMessages(conversationId);
    },
    [loadMessages]
  );

  const activeMessages = useMemo(
    () => (activeConversationId ? state.messages[activeConversationId] ?? [] : []),
    [state.messages, activeConversationId]
  );

  const activeConversation = useMemo(
    () => state.conversations.find((conv) => conv.id === activeConversationId) ?? null,
    [state.conversations, activeConversationId]
  );

  return {
    conversations: state.conversations,
    activeConversation,
    activeConversationId,
    messages: activeMessages,
    loading: state.loading,
    botTyping: state.botTyping,
    selectConversation,
    sendMessage,
    loadMessages,
  };
}
