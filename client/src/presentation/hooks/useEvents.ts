import { useState, useMemo } from 'react';
import type { Event, EventCategory, ViewMode } from '@/shared/types/event';

/**
 * Hook pour gérer les événements (filtres, vue)
 * Règle: hook < 50 lignes
 */
export function useEvents(upcomingEvents: Event[], pastEvents: Event[]) {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filteredUpcoming = useMemo(() => {
    if (selectedCategory === 'all') return upcomingEvents;
    return upcomingEvents.filter(e => e.category === selectedCategory);
  }, [upcomingEvents, selectedCategory]);

  const filteredPast = useMemo(() => {
    if (selectedCategory === 'all') return pastEvents;
    return pastEvents.filter(e => e.category === selectedCategory);
  }, [pastEvents, selectedCategory]);

  return {
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    filteredUpcoming,
    filteredPast,
  };
}
