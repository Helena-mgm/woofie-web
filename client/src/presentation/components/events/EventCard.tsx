"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Event } from '@/shared/types/event';
import { EventAttendeesModal } from './EventAttendeesModal';
import { EditEventModal } from './EditEventModal';
import { getImageUrl } from '@/infrastructure/config/constants';

interface EventCardProps {
  event: Event;
  index: number;
  currentUserId?: number;
  onJoin?: (id: number) => Promise<Event | null>;
  onLeave?: (id: number) => Promise<Event | null>;
  onEdit?: (id: number, payload: Partial<Event>) => Promise<Event | null>;
  onDelete?: (id: number) => Promise<boolean>;
}

export function EventCard({ event, index, currentUserId, onJoin, onLeave, onEdit, onDelete }: EventCardProps) {
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [isEditOpen, setIsEditOpen]           = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOrganizer = currentUserId !== undefined && event.organizerId === currentUserId;
  const status = event.currentUserStatus ?? null;
  const attendeeCount = event.attendees ?? 0;
  const max = event.maxAttendees ?? null;
  const isFull = event.isFull ?? (max !== null && attendeeCount >= max);

  const handleJoin = async () => {
    if (!onJoin || busy) return;
    setBusy(true);
    await onJoin(event.id);
    setBusy(false);
  };

  const handleLeave = async () => {
    if (!onLeave || busy) return;
    setBusy(true);
    await onLeave(event.id);
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    setDeleting(true);
    const ok = await onDelete(event.id);
    if (!ok) { setDeleting(false); setConfirmDelete(false); }
    // If ok, the card disappears from the list
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col"
    >
      {/* Header coloré */}
      <div className="bg-gradient-to-r from-[#D2691E] to-[#8B4513] px-5 pt-5 pb-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                {event.category}
              </span>
              {event.isPrivate && (
                <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs">🔒 Privé</span>
              )}
              {event.requiresApproval && (
                <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs">✅ Sur approbation</span>
              )}
            </div>
            <h3 className="text-lg font-bold leading-snug line-clamp-2">{event.title}</h3>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-4xl leading-none">{event.image}</span>
            {/* CRUD buttons — organizer only */}
            {isOrganizer && (
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditOpen(true)}
                  title="Modifier"
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Supprimer"
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-red-400/60 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Organisateur */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
          {event.organizerPhoto ? (
            <img
              src={getImageUrl(event.organizerPhoto)}
              alt={event.organizerName ?? 'Organisateur'}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-white/40"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {(event.organizerName ?? '?')[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm text-white/90 font-medium truncate">
            Organisé par <span className="text-white font-semibold">{event.organizerName ?? 'Woofie'}</span>
          </span>
        </div>
      </div>

      {/* Corps */}
      <div className="px-5 py-4 flex-1 space-y-2">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span>📅</span>
          <span>
            {new Date(event.date + 'T00:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span>🕐</span>
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span>📍</span>
          <span className="line-clamp-1">{event.location}</span>
          {event.lat && event.lng && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${event.lat}&mlon=${event.lng}#map=16/${event.lat}/${event.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex-shrink-0 text-[#D2691E] hover:underline text-xs"
            >
              Voir sur la carte →
            </a>
          )}
        </div>
        <p className="text-gray-600 text-sm line-clamp-3 pt-1">{event.description}</p>
      </div>

      {/* Footer : jauge + bouton */}
      <div className="px-5 pb-5 space-y-3">
        {/* Barre de places */}
        <div>
          <button
            onClick={() => setIsAttendeesOpen(true)}
            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-[#8B4513] transition-colors mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <span>👥</span>
              <span className="font-medium">
                {attendeeCount} participant{attendeeCount !== 1 ? 's' : ''}
              </span>
              {max !== null && (
                <span className="text-gray-400">/ {max} places</span>
              )}
            </span>
            <span className="text-xs text-gray-400 hover:text-[#D2691E]">Voir la liste →</span>
          </button>
          {max !== null && (
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? 'bg-red-400' : attendeeCount / max > 0.7 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (attendeeCount / max) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Action */}
        <ActionButton
          isOrganizer={isOrganizer}
          status={status}
          isFull={isFull}
          busy={busy}
          isLoggedIn={currentUserId !== undefined}
          requiresApproval={event.requiresApproval}
          onJoin={handleJoin}
          onLeave={handleLeave}
        />

        {/* Lien vers le groupe de discussion */}
        {event.conversationId && (isOrganizer || status === 'accepted') && (
          <Link
            href={`/messages?conversation=${event.conversationId}`}
            className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-[#8B4513] hover:text-[#D2691E] transition-colors py-1"
          >
            <span>💬</span>
            <span>Groupe de l'événement</span>
            <span>→</span>
          </Link>
        )}
      </div>

      <EventAttendeesModal
        event={event}
        open={isAttendeesOpen}
        onClose={() => setIsAttendeesOpen(false)}
      />

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl p-6">
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-xs w-full">
            <div className="text-4xl mb-3">🗑️</div>
            <p className="font-bold text-gray-800 mb-1">Supprimer l'événement ?</p>
            <p className="text-sm text-gray-500 mb-5">Cette action est irréversible. Le groupe de discussion sera aussi supprimé.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {isEditOpen && onEdit && (
        <EditEventModal
          event={event}
          onClose={() => setIsEditOpen(false)}
          onSave={onEdit}
        />
      )}
    </motion.article>
  );
}

interface ActionButtonProps {
  isOrganizer: boolean;
  status: string | null;
  isFull: boolean;
  busy: boolean;
  isLoggedIn: boolean;
  requiresApproval?: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

function ActionButton({ isOrganizer, status, isFull, busy, isLoggedIn, requiresApproval, onJoin, onLeave }: ActionButtonProps) {
  if (isOrganizer) {
    return (
      <span className="block w-full text-center px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
        🎤 Vous êtes l'organisateur
      </span>
    );
  }
  if (status === 'accepted') {
    return (
      <button
        onClick={onLeave}
        disabled={busy}
        className="w-full px-4 py-2 rounded-full border border-red-200 text-red-600 bg-red-50 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {busy ? '…' : '✓ Inscrit · Quitter'}
      </button>
    );
  }
  if (status === 'pending') {
    return (
      <button
        onClick={onLeave}
        disabled={busy}
        className="w-full px-4 py-2 rounded-full border border-yellow-200 text-yellow-700 bg-yellow-50 text-sm font-semibold hover:bg-yellow-100 transition-colors disabled:opacity-50"
      >
        {busy ? '…' : "⏳ En attente d'approbation · Annuler"}
      </button>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="block w-full text-center px-4 py-2 rounded-full bg-gray-50 text-gray-500 text-sm">
        ✗ Demande refusée
      </span>
    );
  }
  if (!isLoggedIn) {
    return (
      <span className="block w-full text-center px-4 py-2 rounded-full bg-gray-50 text-gray-400 text-sm">
        Connectez-vous pour participer
      </span>
    );
  }
  if (isFull) {
    return (
      <span className="block w-full text-center px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-sm font-medium">
        🚫 Complet
      </span>
    );
  }
  return (
    <button
      onClick={onJoin}
      disabled={busy}
      className="w-full px-4 py-2 rounded-full bg-[#D2691E] text-white text-sm font-semibold hover:bg-[#8B4513] transition-colors disabled:opacity-50 active:scale-95"
    >
      {busy ? '…' : requiresApproval ? '📩 Demander à rejoindre' : '🐾 Participer'}
    </button>
  );
}
