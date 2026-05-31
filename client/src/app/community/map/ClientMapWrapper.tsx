"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/features/community/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#e8e0d4] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-[#8B4513]/60">
        <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm font-medium">Chargement de la carte…</span>
      </div>
    </div>
  ),
});

export function ClientMapWrapper() {
  return <MapView />;
}

export default ClientMapWrapper;
