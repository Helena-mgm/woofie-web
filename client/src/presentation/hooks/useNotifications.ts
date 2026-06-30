'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '@/shared/lib/api';

export interface AppNotification {
  id: number;
  type:
    | 'event_join'
    | 'event_leave'
    | 'event_pending'
    | 'event_approved'
    | 'event_rejected';
  title: string;
  body: string;
  data?: {
    eventId?: number;
    userId?: number;
    conversationId?: number;
  } | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
}

interface UseNotificationsReturn extends NotificationsState {
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL = 30_000; // 30 s

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await apiRequest('/api/notifications');
      if (!res.ok) return;
      const data = await res.json() as {
        notifications: AppNotification[];
        unreadCount: number;
      };
      setState(prev => ({
        ...prev,
        notifications: data.notifications ?? [],
        unreadCount: data.unreadCount ?? 0,
        loading: false,
      }));
    } catch {
      // Silent fail — user may not be logged in
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, POLL_INTERVAL);

    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const markRead = useCallback(async (id: number) => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }, []);

  const markAllRead = useCallback(async () => {
    await apiRequest('/api/notifications/read-all', { method: 'POST' });
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    const wasUnread = state.notifications.find(n => n.id === id)?.isRead === false;
    await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
      unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
    }));
  }, [state.notifications]);

  return { ...state, markRead, markAllRead, deleteNotification, refresh };
}
