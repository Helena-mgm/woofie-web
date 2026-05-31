import { apiGet, apiPost } from '@/shared/lib/api-v2';

export interface BotResponse {
  id: number;
  conversationId: number;
  content: string;
  createdAt: string;
  sender: 'bot';
}

export const getBotConversation = async (): Promise<{ id: number; name: string; type: string } | null> => {
  const response = await apiGet('/api/bot/conversation');
  if (response.ok && response.data) {
    return response.data as { id: number; name: string; type: string };
  }
  return null;
};

export const sendBotMessage = async (
  conversationId: number | null,
  message: string
): Promise<BotResponse | null> => {
  const payload = conversationId !== null && conversationId !== undefined
    ? { conversationId, message }
    : { message };

  const response = await apiPost('/api/bot/chat', payload);

  if (response.ok && response.data) {
    return response.data as BotResponse;
  }
  return null;
};
