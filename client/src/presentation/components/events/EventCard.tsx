import { motion } from 'framer-motion';
import type { Event } from '@/shared/types/event';

interface EventCardProps {
  event: Event;
  index: number;
}

/**
 * Carte d'événement
 * Règle: composant < 100 lignes
 */
export function EventCard({ event, index }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
    >
      <EventHeader event={event} />
      <EventBody event={event} />
      <EventFooter event={event} />
    </motion.div>
  );
}

function EventHeader({ event }: { event: Event }) {
  return (
    <div className="bg-gradient-to-r from-[#D2691E] to-[#8B4513] p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-2">
            {event.category}
          </span>
          <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
        </div>
        <span className="text-5xl">{event.image}</span>
      </div>
    </div>
  );
}

function EventBody({ event }: { event: Event }) {
  return (
    <div className="p-6 space-y-3">
      <div className="flex items-center text-gray-600">
        <span className="mr-2">📅</span>
        <span>{new Date(event.date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}</span>
      </div>
      <div className="flex items-center text-gray-600">
        <span className="mr-2">🕐</span>
        <span>{event.time}</span>
      </div>
      <div className="flex items-center text-gray-600">
        <span className="mr-2">📍</span>
        <span>{event.location}</span>
      </div>
      <p className="text-gray-700 mt-4">{event.description}</p>
    </div>
  );
}

function EventFooter({ event }: { event: Event }) {
  return (
    <div className="p-6 bg-gray-50 flex items-center justify-between">
      <div className="flex items-center text-gray-600">
        <span className="mr-2">👥</span>
        <span className="font-medium">{event.attendees} participants</span>
      </div>
      <button className="px-6 py-2 bg-[#D2691E] text-white rounded-full hover:bg-[#8B4513] transition-all">
        Participer
      </button>
    </div>
  );
}
