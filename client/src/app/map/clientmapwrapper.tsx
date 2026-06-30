"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { apiRequest } from "@/shared/lib/api";
import type { MapEvent } from "@/shared/types/map";
import type { Event } from "@/shared/types/event";

const MapView = dynamic(() => import("@/features/community/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#e8e0d4] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-[#8B4513]/60">
        <span className="text-sm font-medium">Chargement de la carte...</span>
      </div>
    </div>
  ),
});

export function ClientMapWrapper() {
  const [mapEvents, setMapEvents] = useState<MapEvent[]>([]);

  useEffect(() => {
    apiRequest("/api/events")
      .then(r => r.json())
      .then((data: { upcoming: Event[]; past: Event[] }) => {
        const all = [...(data.upcoming ?? []), ...(data.past ?? [])];
        const withCoords = all
          .filter((e): e is Event & { lat: number; lng: number } =>
            typeof e.lat === "number" && typeof e.lng === "number"
          )
          .map(e => ({
            id: e.id,
            name: e.title,
            lat: e.lat,
            lng: e.lng,
            description: [
              e.date + " a " + e.time,
              e.location,
              e.organizerName ? "Organise par " + e.organizerName : null,
              e.maxAttendees
                ? e.attendees + "/" + e.maxAttendees + " places"
                : e.attendees ? e.attendees + " participant(s)" : null,
            ].filter(Boolean).join(" - "),
          }));
        setMapEvents(withCoords);
      })
      .catch(() => {});
  }, []);

  return <MapView events={mapEvents} />;
}

export default ClientMapWrapper;
