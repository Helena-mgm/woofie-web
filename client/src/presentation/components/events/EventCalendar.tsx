"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Event } from "@/shared/types/event";
import { EventCard } from "./EventCard";

interface EventCalendarProps {
  events: Event[];
  currentUserId?: number;
  onJoin?: (id: number) => Promise<Event | null>;
  onLeave?: (id: number) => Promise<Event | null>;
  onEdit?: (id: number, payload: Partial<Event>) => Promise<Event | null>;
  onDelete?: (id: number) => Promise<boolean>;
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function EventCalendar({ events, currentUserId, onJoin, onLeave, onEdit, onDelete }: EventCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedKey ? eventsByDay.get(selectedKey) ?? [] : [];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#F1E5D4] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setMonth((prev) => subMonths(prev, 1))}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#8B4513] transition-colors hover:bg-[#FFF5E6]"
          >
            ← Précédent
          </button>
          <h3 className="text-lg font-bold capitalize text-[#3E2A1B]">
            {format(month, "MMMM yyyy", { locale: fr })}
          </h3>
          <button
            onClick={() => setMonth((prev) => addMonths(prev, 1))}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#8B4513] transition-colors hover:bg-[#FFF5E6]"
          >
            Suivant →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-[#A0522D]">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const selected = selectedDate ? isSameDay(day, selectedDate) : false;
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(hasEvents ? day : null)}
                disabled={!hasEvents}
                className={`relative flex h-16 flex-col items-center justify-start gap-1 rounded-2xl p-1.5 text-sm transition-colors ${
                  !inMonth ? "text-[#D8C3AA]" : "text-[#3E2A1B]"
                } ${
                  selected
                    ? "bg-[#D2691E] text-white"
                    : hasEvents
                    ? "cursor-pointer bg-[#FFF5E6] hover:bg-[#FFE8CC]"
                    : "cursor-default"
                }`}
              >
                <span className={`font-semibold ${isToday(day) && !selected ? "text-[#D2691E]" : ""}`}>
                  {format(day, "d")}
                </span>
                {hasEvents && (
                  <span className={`text-[10px] font-bold ${selected ? "text-white" : "text-[#D2691E]"}`}>
                    {dayEvents.length} évt{dayEvents.length > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedEvents.length > 0 ? (
        <div>
          <h3 className="mb-4 text-xl font-bold text-[#3E2A1B]">
            Événements du {format(selectedDate, "d MMMM yyyy", { locale: fr })}
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {selectedEvents.map((event, index) => (
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
        </div>
      ) : (
        <p className="text-center text-sm text-[#6B4A2B]">
          Sélectionnez un jour en surbrillance pour voir ses événements.
        </p>
      )}
    </div>
  );
}
