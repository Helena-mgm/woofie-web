/**
 * Types et interfaces pour les événements
 * Règle: types séparés de la logique
 */
export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: 'Rencontre' | 'Formation' | 'Compétition' | 'Charity';
  attendees: number;
  image: string;
}

export type EventCategory = 'all' | Event['category'];
export type ViewMode = 'list' | 'calendar';
