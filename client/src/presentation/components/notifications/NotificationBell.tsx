'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications, type AppNotification } from '@/presentation/hooks/useNotifications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `il y a ${hrs} h`;
  return `il y a ${Math.floor(hrs / 24)} j`;
}

const TYPE_ICON: Record<AppNotification['type'], string> = {
  event_join:     '🎉',
  event_leave:    '👋',
  event_pending:  '⏳',
  event_approved: '✅',
  event_rejected: '❌',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router  = useRouter();

  // Close desktop dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleNotifClick = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.id);
    if (n.data?.conversationId) {
      router.push(`/messages?conversation=${n.data.conversationId}`);
    } else if (n.data?.eventId) {
      router.push('/events');
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>

      {/* ── Bell button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B]"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-[3px] text-[10px] font-bold leading-none text-white bg-[#FF6B6B] rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        className={`min-[1200px]:hidden fixed inset-0 z-[59] bg-black/50 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Panel (bottom sheet on mobile / dropdown on desktop) ─────────── */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-[60] flex flex-col
          bg-white rounded-t-3xl shadow-2xl
          max-h-[82dvh]
          transition-transform duration-300 ease-out
          min-[1200px]:absolute min-[1200px]:inset-x-auto min-[1200px]:bottom-auto
          min-[1200px]:top-12 min-[1200px]:right-0 min-[1200px]:w-80
          min-[1200px]:max-h-[70vh] min-[1200px]:rounded-2xl
          min-[1200px]:shadow-2xl min-[1200px]:border min-[1200px]:border-gray-100
          ${open
            ? 'translate-y-0 pointer-events-auto'
            : 'translate-y-full min-[1200px]:opacity-0 min-[1200px]:scale-95 min-[1200px]:pointer-events-none min-[1200px]:translate-y-0'}
        `}
        style={open ? undefined : { pointerEvents: 'none' }}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 min-[1200px]:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-[#FF6B6B] rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Tout marquer comme lu"
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF6B6B] hover:bg-red-50 transition-colors"
              >
                <CheckCheck size={16} />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bell size={36} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-xs mt-1 text-gray-300">Vous êtes à jour 🎉</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationRow
                key={n.id}
                notification={n}
                onClick={() => handleNotifClick(n)}
                onRead={() => markRead(n.id)}
                onDelete={() => deleteNotification(n.id)}
              />
            ))
          )}
        </div>

        {/* Safe area spacer (mobile home indicator) */}
        <div className="shrink-0 h-[env(safe-area-inset-bottom,0px)] min-[1200px]:hidden" />
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function NotificationRow({
  notification: n,
  onClick,
  onRead,
  onDelete,
}: {
  notification: AppNotification;
  onClick: () => void;
  onRead: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors active:scale-[0.98] ${
        n.isRead
          ? 'hover:bg-gray-50'
          : 'bg-orange-50/60 hover:bg-orange-100/60'
      }`}
    >
      {/* Unread dot */}
      <span className={`shrink-0 mt-2 w-2 h-2 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-[#FF6B6B]'}`} />

      {/* Icon */}
      <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type]}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Action buttons (tap-friendly on mobile) */}
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!n.isRead && (
          <button
            onClick={e => { e.stopPropagation(); onRead(); }}
            title="Marquer comme lu"
            className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title="Supprimer"
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
