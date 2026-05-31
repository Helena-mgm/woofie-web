"use client";

import { useState } from "react";
import { Map } from "@/presentation/components/map/Map";

export default function MapView() {
  const [showPoi, setShowPoi] = useState(true);

  return (
    <div className="relative w-full h-full">
      {/* Carte plein écran */}
      <Map
        showPOI={showPoi}
        events={[]}
        className="w-full h-full"
      />

      {/* Bouton flottant — toggle services */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center justify-center w-full px-4">
        <button
          onClick={() => setShowPoi((p) => !p)}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#F1E5D4] bg-white/95 px-4 py-2 text-sm font-semibold text-[#8B4513] shadow-[0_4px_16px_rgba(141,62,11,0.15)] backdrop-blur transition hover:bg-[#FFF7ED] active:scale-95"
        >
          {showPoi ? (
            <>
              <span className="text-base">👁️</span>
              Services visibles
            </>
          ) : (
            <>
              <span className="text-base">🐾</span>
              Afficher les services
            </>
          )}
        </button>
      </div>
    </div>
  );
}
