import { useState, useMemo, useCallback, useEffect } from 'react';
import { apiRequest, tokenManager } from '@/shared/lib/api';
import type { Event, EventCategory, ViewMode } from '@/shared/types/event';

interface EventsApiResponse {
  upcoming: Event[];
  past: Event[];
}

/**
 * Hook principal pour les événements.
 * Appelle le backend Symfony /api/events (JWT optionnel pour la lecture).
 */
export function useEvents(userId?: number) {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [past, setPast]         = useState<Event[]>([]);
  const [loading, setLoading]   = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');
  const [viewMode, setViewMode]                 = useState<ViewMode>('list');

  // ── Chargement ─────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await apiRequest('/api/events');
      const data = (await res.json()) as EventsApiResponse;
      setUpcoming(data.upcoming ?? []);
      setPast(data.past ?? []);
    } catch {
      // réseau inaccessible : liste vide
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Filtres ─────────────────────────────────────────────────────────────
  const filteredUpcoming = useMemo(() =>
    selectedCategory === 'all' ? upcoming : upcoming.filter(e => e.category === selectedCategory),
  [upcoming, selectedCategory]);

  const filteredPast = useMemo(() =>
    selectedCategory === 'all' ? past : past.filter(e => e.category === selectedCategory),
  [past, selectedCategory]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const joinEvent = useCallback(async (eventId: number): Promise<Event | null> => {
    if (!tokenManager.exists()) return null;
    try {
      const res = await apiRequest(`/api/events/${eventId}/join`, { method: 'POST' });
      if (!res.ok) return null;
      const updated = (await res.json()) as Event;
      setUpcoming(prev => prev.map(e => e.id === eventId ? updated : e));
      return updated;
    } catch { return null; }
  }, []);

  const leaveEvent = useCallback(async (eventId: number): Promise<Event | null> => {
    if (!tokenManager.exists()) return null;
    try {
      const res = await apiRequest(`/api/events/${eventId}/leave`, { method: 'POST' });
      if (!res.ok) return null;
      const updated = (await res.json()) as Event;
      setUpcoming(prev => prev.map(e => e.id === eventId ? updated : e));
      setPast(prev    => prev.map(e => e.id === eventId ? updated : e));
      return updated;
    } catch { return null; }
  }, []);

  const createEvent = useCallback(async (
    payload: Omit<Event, 'id' | 'attendees' | 'attendeesList' | 'currentUserStatus'>
  ): Promise<Event | null> => {
    try {
      const res = await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const created = (await res.json()) as Event;
      setUpcoming(prev => [created, ...prev]);
      return created;
    } catch { return null; }
  }, []);

  const updateEvent = useCallback(async (id: number, payload: Partial<Event>): Promise<Event | null> => {
    if (!tokenManager.exists()) return null;
    try {
      const res = await apiRequest(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const updated = (await res.json()) as Event;
      setUpcoming(prev => prev.map(e => e.id === id ? updated : e));
      setPast(prev    => prev.map(e => e.id === id ? updated : e));
      return updated;
    } catch { return null; }
  }, []);

  const deleteEvent = useCallback(async (id: number): Promise<boolean> => {
    if (!tokenManager.exists()) return false;
    try {
      const res = await apiRequest(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      setUpcoming(prev => prev.filter(e => e.id !== id));
      setPast(prev    => prev.filter(e => e.id !== id));
      return true;
    } catch { return false; }
  }, []);

  const getMyEvents = useCallback((): Event[] => {
    if (!userId) return [];
    return [...upcoming, ...past].filter(e => e.currentUserStatus === 'accepted');
  }, [upcoming, past, userId]);

  return {
    selectedCategory, setSelectedCategory,
    viewMode, setViewMode,
    filteredUpcoming, filteredPast,
    loading,
    joinEvent, leaveEvent, createEvent, updateEvent, deleteEvent,
    getMyEvents,
    refetch: fetchEvents,
  };
}

