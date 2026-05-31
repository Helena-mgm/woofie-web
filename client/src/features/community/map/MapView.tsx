"use client";

import { useEffect, useState } from "react";
import { Map } from "@/presentation/components/map/Map";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

const highlightPlaces = [
  { id: 1, name: "Parc Monceau", category: "Parc canin" },
  { id: 2, name: "Clinique Happy Paws", category: "Vétérinaire" },
  { id: 3, name: "Latte & Leash", category: "Café dog-friendly" },
  { id: 4, name: "Woofie Training Hub", category: "Éducation" },
];

const categoryIcon = (category: string) => {
  if (category.toLowerCase().includes("parc")) return "🌳";
  if (category.toLowerCase().includes("vétérinaire")) return "🏥";
  if (category.toLowerCase().includes("café")) return "☕️";
  return "🐾";
};

const PlaceList = () => (
  <ul className="space-y-3 text-sm text-[#3E2A1B]">
    {highlightPlaces.map((place) => (
      <li
        key={place.id}
        className="flex items-start justify-between rounded-2xl border border-[#F1E5D4] bg-white/80 p-4 shadow-sm"
      >
        <div className="max-w-[75%] space-y-1">
          <p className="font-semibold text-[#8B4513]">{place.name}</p>
          <p className="text-xs text-[#A0522D]">{place.category}</p>
        </div>
        <span className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF2E0] text-lg">
          {categoryIcon(place.category)}
        </span>
      </li>
    ))}
  </ul>
);

export default function MapView() {
  const [showPoi, setShowPoi] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (!isSheetOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSheetOpen]);

  const togglePoiVisibility = () => setShowPoi((prev) => !prev);

  return (
    <div className="relative w-full">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
        <Card className="hidden h-fit flex-col gap-5 rounded-[26px] border border-[#F1E5D4] bg-white/90 p-6 shadow-sm lg:flex">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]">À découvrir</p>
            <h2 className="text-xl font-bold text-[#3E2A1B]">Lieux favoris de la meute</h2>
            <p className="text-sm text-[#6B4A2B]">
              Nos membres recommandent ces spots pour se promener, soigner ou chouchouter leurs compagnons.
            </p>
          </header>

          <PlaceList />

          <div className="flex flex-col gap-3 pt-1">
            <Button variant="secondary" className="w-full" onClick={togglePoiVisibility}>
              {showPoi ? "Masquer" : "Afficher"} les services à proximité
            </Button>
          </div>
        </Card>

        <div className="relative overflow-hidden rounded-[28px] border border-[#F1E5D4] bg-white shadow-lg shadow-orange-200/20">
          <Map showPOI={showPoi} events={[]} className="h-[68vh] min-h-[420px] sm:h-[72vh] lg:h-[70vh]" />
          <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/60" aria-hidden />
        </div>
      </div>

      {/* Mobile quick actions */}
      <div className="lg:hidden">
        {!isSheetOpen && (
          <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
            <button
              onClick={() => setIsSheetOpen(true)}
              className="mx-auto w-full max-w-[min(520px,calc(100%-2rem))] rounded-full border border-[#F1E5D4] bg-white/95 px-5 py-3 text-sm font-semibold text-[#8B4513] shadow-[0_12px_30px_rgba(141,62,11,0.12)] backdrop-blur transition hover:text-[#A0522D]"
            >
              📋 Lieux favoris autour de vous
            </button>
          </div>
        )}

        {isSheetOpen && (
          <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="rounded-t-3xl border border-[#F1E5D4] bg-white/95 shadow-[0_-16px_32px_rgba(141,62,11,0.12)] backdrop-blur">
              <div className="mx-auto w-full max-w-lg px-5 py-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]">Autour de vous</div>
                    <h3 className="text-base font-semibold text-[#3E2A1B]">Lieux favoris de la meute</h3>
                  </div>
                  <button
                    onClick={() => setIsSheetOpen(false)}
                    className="rounded-full px-3 py-1 text-sm font-semibold text-[#8B4513] hover:bg-[#FFF2E0]"
                  >
                    Fermer
                  </button>
                </div>

                <div className="mb-5 max-h-[42vh] overflow-y-auto pr-1">
                  <PlaceList />
                </div>

                <div className="flex flex-col gap-3">
                  <Button variant="secondary" className="w-full" onClick={togglePoiVisibility}>
                    {showPoi ? "Masquer" : "Afficher"} les services sur la carte
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Continuer l’exploration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
