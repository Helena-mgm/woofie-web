"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EventFilters } from "@/presentation/components/events/EventFilters";
import { EventList } from "@/presentation/components/events/EventList";
import { ViewToggle } from "@/presentation/components/events/ViewToggle";
import { useEvents } from "@/presentation/hooks/useEvents";
import { useAuth } from "@/presentation/hooks/useAuth";
import { CreateEventModal } from "@/presentation/components/events/CreateEventModal";

export default function EventsPage() {
  const { user } = useAuth();
  const {
    selectedCategory, setSelectedCategory,
    viewMode, setViewMode,
    filteredUpcoming, filteredPast,
    loading,
    joinEvent, leaveEvent, createEvent, updateEvent, deleteEvent,
    getMyEvents,
  } = useEvents(user?.id);

  const [showCreate, setShowCreate] = useState(false);
  const myEvents = getMyEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">

        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-[#3E2A1B] sm:text-5xl">Événements Woofie</h1>
            <p className="mt-2 text-sm text-[#6B4A2B]">
              Rencontres, ateliers et sorties dog-friendly sélectionnées.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex-shrink-0 px-5 py-2.5 bg-[#D2691E] text-white rounded-full font-semibold hover:bg-[#8B4513] transition-colors shadow-md"
            >
              + Créer un événement
            </button>
          )}
        </motion.div>

        {/* Filtres */}
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <EventFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>

        {loading && (
          <div className="text-center py-16 text-[#8B4513] text-lg animate-pulse">
            Chargement des événements…
          </div>
        )}

        {!loading && viewMode === "list" && (
          <div className="space-y-10">
            <EventList
              events={filteredUpcoming}
              title="À venir"
              emptyMessage="Aucun événement à venir pour cette catégorie"
              currentUserId={user?.id}
              onJoin={joinEvent}
              onLeave={leaveEvent}
              onEdit={updateEvent}
              onDelete={deleteEvent}
            />
            <EventList
              events={filteredPast}
              title="Moments passés"
              emptyMessage="Aucun événement passé enregistré pour cette catégorie"
              currentUserId={user?.id}
              onJoin={joinEvent}
              onLeave={leaveEvent}
              onEdit={updateEvent}
              onDelete={deleteEvent}
            />
          </div>
        )}

        {!loading && viewMode === "calendar" && (
          <CalendarPlaceholder count={filteredUpcoming.length} />
        )}
      </div>

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreate={createEvent}
        />
      )}
    </div>
  );
}

function CalendarPlaceholder({ count }: { count: number }) {
  return (
    <div className="rounded-3xl border border-[#F1E5D4] bg-white p-12 text-center text-[#6B4A2B] shadow-sm">
      <div className="text-6xl">📅</div>
      <p className="mt-4 text-lg font-semibold">Vue calendrier</p>
      <p className="text-sm">
        {count} événement{count !== 1 ? "s" : ""} prévu{count !== 1 ? "s" : ""} — intégration à venir.
      </p>
    </div>
  );
}
