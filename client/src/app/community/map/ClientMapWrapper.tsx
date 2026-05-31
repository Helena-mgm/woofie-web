"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/features/community/map/MapView"), {
  ssr: false,
  loading: () => <div className="h-[70vh] rounded-[32px] bg-white/60 animate-pulse" />,
});

export function ClientMapWrapper() {
  return <MapView />;
}

export default ClientMapWrapper;
