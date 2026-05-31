// Singleton WebSocket service pour le chat
import { WSMessage } from '@/shared/types/chat';

const wsDebugEnabled = process.env.NEXT_PUBLIC_WS_DEBUG === 'true';

type MessageHandler = (message: WSMessage) => void;

class ChatWebSocketService {
  private static instance: ChatWebSocketService;
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private url: string;

  private constructor() {
    // SSR-safe: ne s'exécute que côté client
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
      this.url = `${protocol}//${host}/ws/chat`;
    } else {
      this.url = '';
    }
  }

  public static getInstance(): ChatWebSocketService {
    // SSR-safe: ne crée l'instance que côté client
    if (typeof window === 'undefined') {
      return {} as ChatWebSocketService; // Mock pour SSR
    }
    if (!ChatWebSocketService.instance) {
      ChatWebSocketService.instance = new ChatWebSocketService();
    }
    return ChatWebSocketService.instance;
  }

  public connect(token?: string): void {
    // Désactiver WebSocket si la variable d'environnement est false
    if (process.env.NEXT_PUBLIC_WS_ENABLED === 'false') {
      if (wsDebugEnabled) {
        console.log('⚠️ WebSocket is disabled via NEXT_PUBLIC_WS_ENABLED');
      }
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = token ? `${this.url}?token=${token}` : this.url;
    
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      return;
    }

    this.ws.onopen = () => {
      if (wsDebugEnabled) {
        console.log('💬 WebSocket connected');
      }
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('❌ Failed to parse WS message:', error);
      }
    };

    this.ws.onerror = (errorEvent) => {
      // Silently ignore WebSocket errors if not enabled
      if (wsDebugEnabled) {
        if ((errorEvent as ErrorEvent).message) {
          console.error('❌ WebSocket error:', (errorEvent as ErrorEvent).message);
        } else {
          console.error('❌ WebSocket error (event):', errorEvent);
        }
      }
    };

    this.ws.onclose = (ev) => {
      if (wsDebugEnabled) {
        console.log('🔌 WebSocket disconnected', { code: (ev as CloseEvent).code, reason: (ev as CloseEvent).reason });
      }
      // Ne pas tenter de reconnexion si WebSocket est désactivé
      if (process.env.NEXT_PUBLIC_WS_ENABLED !== 'false') {
        this.attemptReconnect();
      }
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    if (wsDebugEnabled) {
      console.log(`🔄 Reconnecting in ${delay}ms...`);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
  }

  public subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public send(message: Partial<WSMessage>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      if (wsDebugEnabled) {
        console.warn('⚠️ WebSocket not connected');
      }
    }
  }

  public sendMessage(conversationId: number, content: string): void {
    this.send({
      type: 'message',
      // @ts-expect-error - WebSocket data format
      data: { conversationId, content },
    });
  }

  public sendTyping(conversationId: number, userId: number): void {
    this.send({ type: 'typing', data: { conversationId, userId } });
  }

  public markAsRead(conversationId: number, messageId: number): void {
    this.send({ type: 'read', data: { conversationId, messageId } });
  }

  public initiateCall(
    conversationId: number,
    type: 'voice' | 'video',
    participants: number[]
  ): void {
    this.send({
      type: 'call',
      // @ts-expect-error - WebSocket data format
      data: { conversationId, type, participants, status: 'ringing' },
    });
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const chatWS = ChatWebSocketService.getInstance();
export default ChatWebSocketService;
