"use client";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import type { AvailabilityFilter } from "../hooks/useServices";

const availabilityOptions: Array<{ id: AvailabilityFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "available", label: "Disponibles" },
];

type ServiceFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filter: AvailabilityFilter;
  onFilterChange: (filter: AvailabilityFilter) => void;
  services: readonly string[];
  selectedService: string | null;
  onServiceChange: (value: string | null) => void;
  onReset: () => void;
};

export function ServiceFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  services,
  selectedService,
  onServiceChange,
  onReset,
}: ServiceFiltersProps) {
  return (
    <div className="rounded-3xl border border-[#F1E5D4] bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Input
          value={search}
          placeholder="Recherche par nom ou arrondissement"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {availabilityOptions.map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={filter === option.id ? "primary" : "secondary"}
              onClick={() => onFilterChange(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#8B4513]">
        {services.map((service) => (
          <button
            key={service}
            type="button"
            className={`rounded-full px-3 py-1 ${
              selectedService === service ? "bg-[#D2691E] text-white" : "bg-[#FFF5E6]"
            }`}
            onClick={() => onServiceChange(selectedService === service ? null : service)}
          >
            {service}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}

export default ServiceFilters;
