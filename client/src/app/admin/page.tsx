"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/shared/lib/api";
import { Card } from "@/shared/ui/card";
import { StatTile } from "@/features/admin/components/StatTile";

interface AdminStats {
  users_total: number;
  owners_total: number;
  sitters_total: number;
  banned_total: number;
  admins_total: number;
  sitters_pending: number;
  sitters_verified: number;
  dogs_total: number;
  dogs_lost: number;
  posts_total: number;
  events_total: number;
  events_private: number;
  forbidden_keywords_total: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { ok, data } = await apiGet("/api/admin/stats");
      if (cancelled) return;
      if (ok && data) {
        setStats(data as AdminStats);
      } else {
        setError(true);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3E2A1B]">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-[#6B4A2B]">
          Suivez l&apos;activité de Woofie et intervenez rapidement en cas de besoin.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="p-6 text-sm text-[#B42323]">
          Impossible de charger les statistiques. Réessayez plus tard.
        </Card>
      )}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatTile icon="👥" label="Utilisateurs" value={stats.users_total} />
            <StatTile icon="🐕" label="Propriétaires" value={stats.owners_total} />
            <StatTile icon="🐕‍🦺" label="Dog-sitters" value={stats.sitters_total} />
            <StatTile
              icon="⏳"
              label="Sitters à vérifier"
              value={stats.sitters_pending}
              tone={stats.sitters_pending > 0 ? "warning" : "default"}
            />
            <StatTile icon="✅" label="Sitters vérifiés" value={stats.sitters_verified} />
            <StatTile
              icon="⛔"
              label="Comptes bannis"
              value={stats.banned_total}
              tone={stats.banned_total > 0 ? "danger" : "default"}
            />
            <StatTile icon="🔴" label="Administrateurs" value={stats.admins_total} />
            <StatTile icon="🐶" label="Chiens enregistrés" value={stats.dogs_total} />
            <StatTile
              icon="🚨"
              label="Chiens perdus"
              value={stats.dogs_lost}
              tone={stats.dogs_lost > 0 ? "warning" : "default"}
            />
            <StatTile icon="📰" label="Publications" value={stats.posts_total} />
            <StatTile icon="📅" label="Événements" value={stats.events_total} />
            <StatTile icon="🔒" label="Événements privés" value={stats.events_private} />
          </div>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-bold text-[#3E2A1B]">Actions rapides</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/sitters?status=pending"
                className="rounded-full bg-[#FFF0E0] px-4 py-2 text-sm font-semibold text-[#8B4513] hover:bg-[#FFE8CC] transition-colors"
              >
                🐕‍🦺 {stats.sitters_pending} sitter{stats.sitters_pending !== 1 ? "s" : ""} en attente de vérification
              </Link>
              <Link
                href="/admin/users?status=banned"
                className="rounded-full bg-[#FDECEC] px-4 py-2 text-sm font-semibold text-[#B42323] hover:bg-[#FBDADA] transition-colors"
              >
                ⛔ {stats.banned_total} compte{stats.banned_total !== 1 ? "s" : ""} banni{stats.banned_total !== 1 ? "s" : ""}
              </Link>
              <Link
                href="/admin/keywords"
                className="rounded-full bg-[#FFF5E6] px-4 py-2 text-sm font-semibold text-[#8B4513] hover:bg-[#FFE8CC] transition-colors"
              >
                🚫 {stats.forbidden_keywords_total} mot{stats.forbidden_keywords_total !== 1 ? "s" : ""} interdit{stats.forbidden_keywords_total !== 1 ? "s" : ""}
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
