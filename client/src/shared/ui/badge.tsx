"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#FFF5E6] px-3 py-1 text-xs font-semibold text-[#8B4513]",
        className
      )}
      {...props}
    />
  );
}
