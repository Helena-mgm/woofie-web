"use client";

import { motion } from "framer-motion";
import { ProtectRoute } from "@/features/security/ProtectRoute";
import { EventFilters } from "@/presentation/components/events/EventFilters";
import { EventList } from "@/presentation/components/events/EventList";
import { ViewToggle } from "@/presentation/components/events/ViewToggle";
import { useEvents } from "@/presentation/hooks/useEvents";
import { upcomingEvents, pastEvents } from "@/infrastructure/data/events";

export default function EventsPage() {
  const {
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    filteredUpcoming,
    filteredPast,
  } = useEvents(upcomingEvents, pastEvents);

  return (
    <ProtectRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center text-[#3E2A1B]"
          >
            <h1 className="text-4xl font-bold sm:text-5xl">Événements Woofie</h1>
            <p className="mt-3 text-sm text-[#6B4A2B]">
              Retrouver la meute hors ligne : rencontres, ateliers d’éducation et sorties dog-friendly sélectionnées.
            </p>
          </motion.div>
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <EventFilters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
          {viewMode === "list" ? (
            <div className="space-y-10">
              <EventList
                events={filteredUpcoming}
                title="À venir"
                emptyMessage="Aucun événement à venir pour cette catégorie"
              />
              <EventList
                events={filteredPast}
                title="Moments passés"
                emptyMessage="Aucun événement passé enregistré pour cette catégorie"
              />
            </div>
          ) : (
            <CalendarPlaceholder count={filteredUpcoming.length} />
          )}
        </div>
      </div>
    </ProtectRoute>
  );
}

function CalendarPlaceholder({ count }: { count: number }) {
  return (
    <div className="rounded-3xl border border-[#F1E5D4] bg-white p-12 text-center text-[#6B4A2B] shadow-sm">
      <div className="text-6xl">📅</div>
      <p className="mt-4 text-lg font-semibold">Vue calendrier</p>
      <p className="text-sm">{count} événement{count > 1 ? 's' : ''} prévu{count > 1 ? 's' : ''} — intégration du calendrier à venir.</p>
    </div>
  );
}
