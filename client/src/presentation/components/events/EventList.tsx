import { EventCard } from './EventCard';
import type { Event } from '@/shared/types/event';

interface EventListProps {
  events: Event[];
  title: string;
  emptyMessage?: string;
  currentUserId?: number;
  onJoin?: (id: number) => Promise<Event | null>;
  onLeave?: (id: number) => Promise<Event | null>;
  onEdit?: (id: number, payload: Partial<Event>) => Promise<Event | null>;
  onDelete?: (id: number) => Promise<boolean>;
}

export function EventList({ events, title, emptyMessage, currentUserId, onJoin, onLeave, onEdit, onDelete }: EventListProps) {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-500 text-lg">
            {emptyMessage ?? 'Aucun événement à afficher'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              currentUserId={currentUserId}
              onJoin={onJoin}
              onLeave={onLeave}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
