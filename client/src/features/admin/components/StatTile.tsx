"use client";

import { Card } from "@/shared/ui/card";

export function StatTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: string;
  label: string;
  value: number | string;
  tone?: "default" | "warning" | "danger";
}) {
  const valueClass =
    tone === "warning" ? "text-[#B45309]" : tone === "danger" ? "text-[#B42323]" : "text-[#D2691E]";

  return (
    <Card className="flex flex-col gap-1 p-5">
      <span className="text-2xl">{icon}</span>
      <span className={`text-3xl font-bold ${valueClass}`}>{value}</span>
      <span className="text-sm text-[#6B4A2B]">{label}</span>
    </Card>
  );
}

export default StatTile;
