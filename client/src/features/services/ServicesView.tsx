"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { mockDogSitters, availableServices } from "@/infrastructure/data/services";
import { ServicesHero } from "./components/ServicesHero";
import { useServices } from "./hooks/useServices";
import { apiGet } from "@/shared/lib/api-v2";
import type { DogSitter } from "@/shared/types/forum";

const ServiceFilters = dynamic(() => import("./components/ServiceFilters"), {
  ssr: false,
  loading: () => <div className="h-32 rounded-3xl bg-white/70 animate-pulse" />,
});

const ServicesGrid = dynamic(() => import("./components/ServicesGrid"), {
  ssr: false,
  loading: () => <ServicesGridSkeleton />,
});

export function ServicesView() {
  const [dataset, setDataset] = useState<DogSitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchSitters = async () => {
      setLoading(true);
      const { ok, data } = await apiGet('/api/sitters');

      if (cancelled) return;

      if (ok && Array.isArray(data)) {
        setDataset(data as DogSitter[]);
        setIsFallback(false);
      } else {
        setDataset(mockDogSitters);
        setIsFallback(true);
      }

      setLoading(false);
    };

    fetchSitters();

    return () => {
      cancelled = true;
    };
  }, []);

  const {
    filter,
    setFilter,
    query,
    setQuery,
    service,
    setService,
    results,
    reset,
  } = useServices(dataset);

  const showFallbackInfo = isFallback && !loading && dataset.length > 0;

  return (
    <div className="space-y-8">
      <ServicesHero />
      <ServiceFilters
        search={query}
        onSearchChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        services={availableServices}
        selectedService={service}
        onServiceChange={setService}
        onReset={reset}
      />
      {loading ? (
        <ServicesGridSkeleton />
      ) : (
        <ServicesGrid
          sitters={results}
          onReset={reset}
          isFallback={showFallbackInfo && results.length > 0}
        />
      )}
    </div>
  );
}

function ServicesGridSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="h-44 rounded-3xl bg-white/70 animate-pulse"
        />
      ))}
    </div>
  );
}
