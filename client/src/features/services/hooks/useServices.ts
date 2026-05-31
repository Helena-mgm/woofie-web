"use client";

import { useMemo, useState } from "react";
import type { DogSitter } from "@/shared/types/forum";

export type AvailabilityFilter = "all" | "available";

export function useServices(dataset: DogSitter[]) {
  const [filter, setFilter] = useState<AvailabilityFilter>("all");
  const [query, setQuery] = useState("");
  const [service, setService] = useState<string | null>(null);

  const results = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return dataset.filter((item) => {
      const matchesAvailability = filter === "all" || item.availability;
      const matchesSearch =
        normalized.length === 0 ||
        item.nom.toLowerCase().includes(normalized) ||
        (item.prenom?.toLowerCase().includes(normalized) ?? false) ||
        (item.city?.toLowerCase().includes(normalized) ?? false);
      const matchesService = !service || item.services?.includes(service);
      return matchesAvailability && matchesSearch && matchesService;
    });
  }, [dataset, filter, query, service]);

  const reset = () => {
    setFilter("all");
    setQuery("");
    setService(null);
  };

  return {
    filter,
    setFilter,
    query,
    setQuery,
    service,
    setService,
    results,
    reset,
  };
}
