import type { Event } from '@/shared/types/event';

interface Props {
  event: Event;
  open: boolean;
  onClose: () => void;
}

export function EventAttendeesModal({ event, open, onClose }: Props) {
  if (!open) return null;

  const list = event.attendeesList ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-bold mb-4">Participants — {event.title}</h3>
        {list.length === 0 ? (
          <p className="text-gray-500">Personne n'est encore inscrit.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((id) => (
              <li key={id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">{String(id)}</div>
                  <div>
                    <div className="font-medium">Utilisateur {id}</div>
                    <div className="text-xs text-gray-400">Profil public</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">—</div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 rounded bg-gray-100" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default EventAttendeesModal;
