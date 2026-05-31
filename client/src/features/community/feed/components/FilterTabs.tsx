"use client";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { FeedFilter } from "../state/feedState";

type FilterTabsProps = {
  filters: Array<{ id: FeedFilter; label: string }>;
  active: FeedFilter;
  onChange: (filter: FeedFilter) => void;
};

export function FilterTabs({ filters, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full bg-white/70 p-2 backdrop-blur">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          size="sm"
          variant={active === filter.id ? "primary" : "secondary"}
          className={cn("rounded-full px-5", active === filter.id ? "" : "border-none")}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

export default FilterTabs;
