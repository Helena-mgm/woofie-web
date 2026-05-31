"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[#F1E5D4] bg-white/90 shadow-[0_12px_40px_-24px_rgba(139,69,19,0.35)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
