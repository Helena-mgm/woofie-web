"use client";

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const baseStyles =
  "w-full rounded-3xl border border-[#E7D9C7] bg-white px-4 py-3 text-sm text-[#3E2A1B] shadow-inner placeholder:text-[#B19A82] focus:border-[#D2691E] focus:outline-none focus:ring-2 focus:ring-[#FFD9A6]";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(baseStyles, className)} {...props} />
  )
);

Textarea.displayName = "Textarea";
