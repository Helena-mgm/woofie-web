'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Users } from 'lucide-react';
import type { Event } from '@/shared/types/event';
import { apiGet } from '@/shared/lib/api';
import { getImageUrl } from '@/infrastructure/config/constants';

interface Props {
  event: Event;
  open: boolean;
  onClose: () => void;
}

interface Attendee {
  userId: number;
  name: string;
  photo: string | null;
  status: 'accepted' | 'pending' | 'rejected';
  joinedAt: string;
}

const STATUS_LABEL: Record<Attendee['status'], string> = {
  accepted: 'Confirmé',
  pending: 'En attente',
  rejected: 'Refusé',
};

const STATUS_CLASSES: Record<Attendee['status'], string> = {
  accepted: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-600',
};

export function EventAttendeesModal({ event, open, onClose }: Props) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    apiGet(`/api/events/${event.id}/attendees`, controller.signal).then(({ ok, data }) => {
      if (controller.signal.aborted) return;
      if (ok && Array.isArray(data)) {
        setAttendees(data);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => controller.abort();
  }, [open, event.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#D2691E] to-[#8B4513] px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/80">
              <Users size={14} /> Participants
            </p>
            <h3 className="truncate text-lg font-bold">{event.title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-[#F5EDE1]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-[#F5EDE1]" />
                    <div className="h-2 w-1/3 rounded bg-[#F5EDE1]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="px-5 py-8 text-center text-sm text-gray-600">
              Impossible de charger les participants pour le moment.
            </p>
          ) : attendees.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-600">
              Personne n&apos;est encore inscrit à cet événement.
            </p>
          ) : (
            <ul className="divide-y divide-[#F5EDE1]">
              {attendees.map((attendee) => (
                <li key={attendee.userId} className="flex items-center gap-3 px-5 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-sm font-bold text-white">
                    {attendee.photo ? (
                      <Image
                        src={getImageUrl(attendee.photo)}
                        alt={attendee.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span>{attendee.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#3E2A1B]">{attendee.name}</p>
                    <p className="text-xs text-[#A07050]">
                      Inscrit le{' '}
                      {new Date(attendee.joinedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASSES[attendee.status]}`}
                  >
                    {STATUS_LABEL[attendee.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-[#F5EDE1] px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-full bg-[#F5EDE1] px-4 py-2 text-sm font-semibold text-[#8B4513] transition-colors hover:bg-[#EDE0D0]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventAttendeesModal;
