"use client";

import { useState, useRef, type FormEvent } from "react";
import type { Event } from "@/shared/types/event";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
}

interface Props {
  event: Event;
  onClose: () => void;
  onSave: (id: number, payload: Partial<Event>) => Promise<Event | null>;
}

type EditPayload = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: Event["category"];
  image: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  maxAttendees: number | null;
  lat: number | null;
  lng: number | null;
};

const CATEGORIES: Event["category"][] = ["Rencontre", "Formation", "Compétition", "Charity"];
const EMOJIS = ["🐾", "🏃", "🎓", "🏆", "❤️", "🎪", "🐕", "🌳", "🚑", "🎉", "🏅", "🤝"];

function formatSuggestion(s: NominatimResult): { main: string; sub: string } {
  const a = s.address ?? {};
  const city = a.city ?? a.town ?? a.village ?? "";
  const road = a.house_number ? `${a.road ?? ""} ${a.house_number}`.trim() : (a.road ?? "");
  const main = s.name ?? road ?? s.display_name.split(",")[0].trim();
  const sub  = [road !== main ? road : "", city, a.postcode].filter(Boolean).join(", ");
  return { main: main || s.display_name.split(",")[0].trim(), sub };
}

export function EditEventModal({ event, onClose, onSave }: Props) {
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<EditPayload>({
    title:            event.title,
    description:      event.description,
    date:             event.date,
    time:             event.time,
    location:         event.location,
    category:         event.category,
    image:            event.image,
    isPrivate:        event.isPrivate ?? false,
    requiresApproval: event.requiresApproval ?? false,
    maxAttendees:     event.maxAttendees ?? null,
    lat:              event.lat ?? null,
    lng:              event.lng ?? null,
  });

  // Géolocalisation
  const [geoQuery, setGeoQuery]       = useState(
    event.lat && event.lng ? event.location : ""
  );
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loadingGeo, setLoadingGeo]   = useState(false);
  const [pickedGeo, setPickedGeo]     = useState<{ label: string } | null>(
    event.lat && event.lng ? { label: event.location } : null
  );
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof EditPayload>(key: K, value: EditPayload[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const searchGeo = (q: string) => {
    setGeoQuery(q);
    setPickedGeo(null);
    set("lat", null);
    set("lng", null);
    if (geoTimer.current) clearTimeout(geoTimer.current);
    if (q.length < 3) { setSuggestions([]); return; }
    geoTimer.current = setTimeout(async () => {
      setLoadingGeo(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=7&addressdetails=1`,
          { headers: { "Accept-Language": "fr" } }
        );
        setSuggestions(await res.json() as NominatimResult[]);
      } catch { setSuggestions([]); }
      finally { setLoadingGeo(false); }
    }, 380);
  };

  const pickSuggestion = (s: NominatimResult) => {
    const { main, sub } = formatSuggestion(s);
    const label = sub ? `${main}, ${sub}` : main;
    setPickedGeo({ label });
    set("lat", parseFloat(s.lat));
    set("lng", parseFloat(s.lon));
    setGeoQuery(label);
    setSuggestions([]);
  };

  const clearGeo = () => {
    setPickedGeo(null);
    setGeoQuery("");
    setSuggestions([]);
    set("lat", null);
    set("lng", null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.location.trim()) {
      setError("Le titre et le lieu sont obligatoires.");
      return;
    }
    setBusy(true);
    const result = await onSave(event.id, form);
    setBusy(false);
    if (!result) { setError("Erreur lors de la sauvegarde."); return; }
    setSuccess(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">

        <div className="bg-gradient-to-r from-[#D2691E] to-[#8B4513] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white">✏️ Modifier l'événement</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {success ? (
          <div className="flex-1 flex items-center justify-center py-16 text-center">
            <div>
              <div className="text-6xl mb-4">✅</div>
              <p className="text-xl font-bold text-[#3E2A1B]">Événement mis à jour !</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Titre *</label>
              <input
                required value={form.title}
                onChange={e => set("title", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                required rows={3} value={form.description}
                onChange={e => set("description", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50 resize-none"
              />
            </div>

            {/* Date + Heure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  required type="date" value={form.date}
                  onChange={e => set("date", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Heure *</label>
                <input
                  required type="time" value={form.time}
                  onChange={e => set("time", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                />
              </div>
            </div>

            {/* Lieu */}
            <div className="space-y-2 border border-gray-100 rounded-xl p-4 bg-gray-50/60">
              <p className="text-sm font-semibold text-gray-700 mb-2">📍 Lieu *</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom affiché *</label>
                <input
                  required value={form.location}
                  onChange={e => set("location", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                  placeholder="Ex : Parc Monceau"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Épingler sur la carte <span className="text-gray-400">(optionnel)</span></label>
                {pickedGeo ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <span className="text-emerald-600 text-sm">✓</span>
                    <span className="flex-1 text-sm text-emerald-800 font-medium truncate">{pickedGeo.label}</span>
                    <button type="button" onClick={clearGeo} className="text-emerald-500 hover:text-red-500 text-xs">Changer</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={geoQuery}
                      onChange={e => searchGeo(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50 pr-8"
                      placeholder="Rechercher une adresse pour l'épingler…"
                      autoComplete="off"
                    />
                    {loadingGeo && <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#D2691E]/30 border-t-[#D2691E] rounded-full animate-spin" />}
                    {suggestions.length > 0 && (
                      <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {suggestions.map(s => {
                          const { main, sub } = formatSuggestion(s);
                          return (
                            <li key={s.place_id}>
                              <button type="button" onClick={() => pickSuggestion(s)}
                                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors">
                                <div className="text-sm font-medium text-gray-800 truncate">{main}</div>
                                {sub && <div className="text-xs text-gray-400 truncate">{sub}</div>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Catégorie + Places max */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Catégorie *</label>
                <select
                  value={form.category}
                  onChange={e => set("category", e.target.value as Event["category"])}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Places max</label>
                <input
                  type="number" min={2}
                  value={form.maxAttendees ?? ""}
                  onChange={e => set("maxAttendees", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                  placeholder="Illimité"
                />
              </div>
            </div>

            {/* Icône */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Icône</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(emoji => (
                  <button key={emoji} type="button" onClick={() => set("image", emoji)}
                    className={`w-9 h-9 rounded-xl text-xl transition-all ${form.image === emoji ? "ring-2 ring-[#D2691E] bg-orange-50 scale-110" : "hover:bg-gray-50"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2.5 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Options</p>
              <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isPrivate}
                  onChange={e => set("isPrivate", e.target.checked)}
                  className="mt-0.5 rounded accent-[#D2691E]" />
                <span>
                  <span className="font-medium">🔒 Événement privé</span>
                  <span className="block text-xs text-gray-400">Visible uniquement des participants</span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.requiresApproval}
                  onChange={e => set("requiresApproval", e.target.checked)}
                  className="mt-0.5 rounded accent-[#D2691E]" />
                <span>
                  <span className="font-medium">✅ Approbation manuelle</span>
                  <span className="block text-xs text-gray-400">Vous validez chaque demande</span>
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-3 pt-1 pb-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#D2691E] text-white text-sm font-semibold hover:bg-[#8B4513] transition-colors disabled:opacity-50">
                {busy ? "Sauvegarde…" : "💾 Sauvegarder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
