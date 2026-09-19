"use client";

import { useEffect, useState } from "react";
import { apiDelete, apiGet } from "@/shared/lib/api";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar } from "@/shared/ui/avatar";
import { getImageUrl } from "@/infrastructure/config/constants";

interface AdminDog {
  id: number;
  nom: string;
  race: string | null;
  sexe: string | null;
  photo_path: string | null;
  is_lost: boolean;
  owner_id: number | null;
  owner_name: string | null;
  created_at: string;
}

export default function AdminDogsPage() {
  const [dogs, setDogs] = useState<AdminDog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { ok, data } = await apiGet("/api/admin/dogs");
      if (ok && Array.isArray(data)) {
        setDogs(data as AdminDog[]);
      }
      setLoading(false);
    })();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement ce profil de chien ?")) return;
    setDeletingId(id);
    const { ok } = await apiDelete(`/api/dogs/${id}`);
    if (ok) {
      setDogs((prev) => prev.filter((d) => d.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3E2A1B]">Chiens</h1>
        <p className="mt-1 text-sm text-[#6B4A2B]">
          Tous les profils de chiens enregistrés sur la plateforme.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      ) : dogs.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6B4A2B]">Aucun chien enregistré.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dogs.map((dog) => (
            <Card key={dog.id} className="flex items-center gap-4 p-4">
              <Avatar src={dog.photo_path ? getImageUrl(dog.photo_path) : null} alt={dog.nom} placeholder="🐶" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#3E2A1B]">{dog.nom}</p>
                  {dog.is_lost && <Badge className="bg-[#FDECEC] text-[#B42323]">🚨 Perdu</Badge>}
                </div>
                <p className="text-sm text-[#A0522D]">{dog.race ?? "Race inconnue"}</p>
                {dog.owner_name && <p className="text-xs text-[#A0522D]">Propriétaire : {dog.owner_name}</p>}
              </div>
              <Button
                size="sm"
                variant="primary"
                className="bg-[#B42323] hover:bg-[#8f1c1c]"
                disabled={deletingId === dog.id}
                onClick={() => handleDelete(dog.id)}
              >
                {deletingId === dog.id ? "…" : "Supprimer"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
