// Types pour le système de chat
export interface ChatUser {
  id: number;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'bot';
  createdAt: Date;
  isRead: boolean;
  replyTo?: number;
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'bot';
  participants: ChatUser[];
  lastMessage?: Message;
  unreadCount: number;
  name?: string; // For groups
  avatar?: string;
  createdAt: Date;
  isBlocked?: boolean;
}

export interface Group extends Conversation {
  ownerId: number;
  adminIds: number[];
  settings: GroupSettings;
  members: GroupMember[];
}

export interface GroupMember extends ChatUser {
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  canInvite: boolean;
}

export interface GroupSettings {
  allowMemberInvites: boolean;
  allowMemberMessages: boolean;
  isPrivate: boolean;
}

export interface CallSession {
  id: string;
  type: 'voice' | 'video';
  conversationId: number;
  initiatorId: number;
  participants: number[];
  status: 'ringing' | 'active' | 'ended';
  startedAt?: Date;
}

export interface BlockedUser {
  userId: number;
  blockedAt: Date;
}

export type WSMessage = 
  | { type: 'message'; data: Message }
  | { type: 'typing'; data: { userId: number; conversationId: number } }
  | { type: 'read'; data: { conversationId: number; messageId: number } }
  | { type: 'call'; data: CallSession }
  | { type: 'user_status'; data: { userId: number; isOnline: boolean } };
