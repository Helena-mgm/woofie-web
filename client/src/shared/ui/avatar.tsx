"use client";

import Image from "next/image";
import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  alt: string;
  placeholder?: string;
};

export function Avatar({ src, alt, placeholder = "🐾", className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#F1E5D4] bg-white text-lg font-semibold text-[#8B4513]",
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={48}
          height={48}
          className="h-full w-full object-cover"
        />
      ) : (
        placeholder
      )}
    </div>
  );
}
