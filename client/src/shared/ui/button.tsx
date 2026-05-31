"use client";

import { forwardRef } from "react";
import { cn } from "@/shared/lib/cn";

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-[#D2691E] text-white hover:bg-[#8B4513] focus-visible:outline-[#D2691E]",
  secondary:
    "bg-white text-[#8B4513] border border-[#E2D5C3] hover:bg-[#FFF5E6] focus-visible:outline-[#A0522D]",
  ghost: "text-[#8B4513] hover:bg-[#FFF5E6]",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  )
);

Button.displayName = "Button";
