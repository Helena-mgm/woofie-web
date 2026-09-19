"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const NAV_ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: "📊", exact: true },
  { href: "/admin/users", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/sitters", label: "Dog-sitters", icon: "🐕‍🦺" },
  { href: "/admin/posts", label: "Publications", icon: "📰" },
  { href: "/admin/events", label: "Événements", icon: "📅" },
  { href: "/admin/dogs", label: "Chiens", icon: "🐶" },
  { href: "/admin/keywords", label: "Mots interdits", icon: "🚫" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="rounded-3xl border border-[#F1E5D4] bg-white/90 p-4 shadow-[0_12px_40px_-24px_rgba(139,69,19,0.35)] backdrop-blur lg:sticky lg:top-24">
            <div className="mb-4 flex items-center gap-2 px-2">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-sm font-bold text-[#8B4513]">Administration</p>
                <p className="text-xs text-[#A0522D]">Modération Woofie</p>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors lg:shrink",
                      isActive
                        ? "bg-[#D2691E] text-white"
                        : "text-[#8B4513] hover:bg-[#FFF5E6]"
                    )}
                  >
                    <span>{item.icon}</span>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}

export default AdminShell;
