"use client";

import { useEffect, useState } from "react";
import { apiDelete, apiGet } from "@/shared/lib/api";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

interface AdminEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  maxAttendees: number | null;
  organizerName: string;
  attendees: number;
  isFull: boolean;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { ok, data } = await apiGet("/api/admin/events");
      if (ok && Array.isArray(data)) {
        setEvents(data as AdminEvent[]);
      }
      setLoading(false);
    })();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement cet événement et son groupe de discussion ?")) return;
    setDeletingId(id);
    const { ok } = await apiDelete(`/api/events/${id}`);
    if (ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3E2A1B]">Événements</h1>
        <p className="mt-1 text-sm text-[#6B4A2B]">
          Vue complète, y compris les événements privés, pour retirer tout contenu problématique.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6B4A2B]">Aucun événement pour le moment.</Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="text-3xl">{event.image}</span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#3E2A1B]">{event.title}</p>
                  <Badge>{event.category}</Badge>
                  {event.isPrivate && <Badge className="bg-[#FDECEC] text-[#B42323]">🔒 Privé</Badge>}
                  {event.requiresApproval && <Badge className="bg-[#FFF3D6] text-[#B45309]">✅ Sur approbation</Badge>}
                  {event.isFull && <Badge className="bg-[#FDECEC] text-[#B42323]">Complet</Badge>}
                </div>
                <p className="text-sm text-[#A0522D]">
                  {new Date(event.date + "T00:00:00").toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  · {event.time} · {event.location}
                </p>
                <p className="text-xs text-[#A0522D]">
                  Organisé par {event.organizerName} · {event.attendees} participant{event.attendees !== 1 ? "s" : ""}
                  {event.maxAttendees !== null ? ` / ${event.maxAttendees}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="bg-[#B42323] hover:bg-[#8f1c1c]"
                disabled={deletingId === event.id}
                onClick={() => handleDelete(event.id)}
              >
                {deletingId === event.id ? "…" : "Supprimer"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
