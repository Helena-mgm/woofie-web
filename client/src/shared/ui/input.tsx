"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const baseStyles =
  "h-11 w-full rounded-2xl border border-[#E7D9C7] bg-white px-4 text-sm text-[#3E2A1B] shadow-inner placeholder:text-[#B19A82] focus:border-[#D2691E] focus:outline-none focus:ring-2 focus:ring-[#FFD9A6]";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseStyles, className)} {...props} />
  )
);

Input.displayName = "Input";
