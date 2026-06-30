/**
 * Types et interfaces pour les événements
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
  attendeesList?: number[];
  organizerId?: number;
  organizerName?: string;
  organizerPhoto?: string | null;
  lat?: number | null;
  lng?: number | null;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  maxAttendees?: number | null;
  isFull?: boolean;
  conversationId?: number | null;
  image: string;
  currentUserStatus?: 'pending' | 'accepted' | 'rejected' | null;
  createdAt?: string;
}

export type EventCategory = 'all' | Event['category'];
export type ViewMode = 'list' | 'calendar';
