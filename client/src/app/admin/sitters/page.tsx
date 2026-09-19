"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost } from "@/shared/lib/api";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar } from "@/shared/ui/avatar";
import { getImageUrl } from "@/infrastructure/config/constants";

interface AdminSitter {
  id: number;
  user_id: number;
  email: string;
  name: string;
  city: string;
  siret: string;
  photo_path: string | null;
  bio: string | null;
  services: string[];
  price_per_hour: number | null;
  is_available: boolean;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
  verified_at: string | null;
}

const STATUS_TABS = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "verified", label: "Vérifiés" },
];

export default function AdminSittersPage() {
  return (
    <Suspense fallback={null}>
      <AdminSittersView />
    </Suspense>
  );
}

function AdminSittersView() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [sitters, setSitters] = useState<AdminSitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchSitters = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await apiGet(`/api/admin/sitters?status=${status}`);
    if (ok && Array.isArray(data)) {
      setSitters(data as AdminSitter[]);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchSitters();
  }, [fetchSitters]);

  const toggleVerified = async (sitter: AdminSitter) => {
    setBusyId(sitter.id);
    const { ok } = await apiPost(`/api/admin/sitters/${sitter.id}/verify`, {
      is_verified: !sitter.is_verified,
    });
    if (ok) await fetchSitters();
    setBusyId(null);
  };

  const toggleBan = async (sitter: AdminSitter) => {
    setBusyId(sitter.id);
    const { ok } = await apiPost(
      `/api/admin/users/${sitter.user_id}/${sitter.is_banned ? "unban" : "ban"}`,
      {}
    );
    if (ok) await fetchSitters();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3E2A1B]">Dog-sitters</h1>
        <p className="mt-1 text-sm text-[#6B4A2B]">
          Validez le SIRET des nouveaux dog-sitters pour les rendre visibles sur la plateforme.
        </p>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              status === tab.value
                ? "bg-[#D2691E] text-white"
                : "bg-white text-[#8B4513] hover:bg-[#FFF5E6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      ) : sitters.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6B4A2B]">Aucun dog-sitter dans cette catégorie.</Card>
      ) : (
        <div className="space-y-3">
          {sitters.map((sitter) => (
            <Card key={sitter.id} className="flex flex-wrap items-start gap-4 p-4">
              <Avatar src={sitter.photo_path ? getImageUrl(sitter.photo_path) : null} alt={sitter.name} />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#3E2A1B]">{sitter.name}</p>
                  {sitter.is_verified ? (
                    <Badge className="bg-[#E7F8EF] text-[#197A43]">✓ Vérifié</Badge>
                  ) : (
                    <Badge className="bg-[#FFF3D6] text-[#B45309]">⏳ En attente</Badge>
                  )}
                  {sitter.is_banned && <Badge className="bg-[#FDECEC] text-[#B42323]">⛔ Banni</Badge>}
                </div>
                <p className="text-sm text-[#A0522D]">
                  {sitter.email} · {sitter.city}
                </p>
                <p className="text-xs text-[#A0522D]">SIRET {sitter.siret}</p>
                {sitter.bio && <p className="text-sm text-[#6B4A2B] line-clamp-2">{sitter.bio}</p>}
                {sitter.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sitter.services.map((s) => (
                      <span key={s} className="rounded-full bg-[#FFF5E6] px-2.5 py-0.5 text-xs text-[#8B4513]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={sitter.is_verified ? "secondary" : "primary"}
                  disabled={busyId === sitter.id}
                  onClick={() => toggleVerified(sitter)}
                >
                  {sitter.is_verified ? "Retirer vérification" : "✓ Vérifier"}
                </Button>
                <Button
                  size="sm"
                  variant={sitter.is_banned ? "secondary" : "primary"}
                  className={sitter.is_banned ? "" : "bg-[#B42323] hover:bg-[#8f1c1c]"}
                  disabled={busyId === sitter.id}
                  onClick={() => toggleBan(sitter)}
                >
                  {sitter.is_banned ? "Débannir" : "Bannir"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
