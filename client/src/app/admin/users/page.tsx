"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost } from "@/shared/lib/api";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Avatar } from "@/shared/ui/avatar";
import { getImageUrl } from "@/infrastructure/config/constants";

interface AdminUser {
  id: number;
  email: string;
  type: "owner" | "sitter";
  name: string;
  city: string | null;
  photo_path: string | null;
  roles: string[];
  is_admin: boolean;
  is_banned: boolean;
  is_verified: boolean;
  sitter_id: number | null;
  sitter_is_verified: boolean | null;
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersView />
    </Suspense>
  );
}

function AdminUsersView() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>(searchParams.get("status") ?? "");
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type) params.set("type", type);
    if (status) params.set("status", status);

    const { ok, data } = await apiGet(`/api/admin/users?${params.toString()}`);
    if (ok && Array.isArray(data)) {
      setUsers(data as AdminUser[]);
    }
    setLoading(false);
  }, [query, type, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const runAction = async (id: number, path: string, body?: unknown) => {
    setBusyId(id);
    const { ok } = await apiPost(`/api/admin${path}`, body ?? {});
    if (ok) await fetchUsers();
    setBusyId(null);
  };

  const toggleBan = (user: AdminUser) =>
    runAction(user.id, `/users/${user.id}/${user.is_banned ? "unban" : "ban"}`);

  const toggleVerified = (user: AdminUser) =>
    runAction(user.id, `/users/${user.id}/verify`, { is_verified: !user.is_verified });

  const toggleAdmin = (user: AdminUser) =>
    runAction(user.id, `/users/${user.id}/role`, {
      roles: user.is_admin ? ["ROLE_USER"] : ["ROLE_USER", "ROLE_ADMIN"],
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3E2A1B]">Utilisateurs</h1>
        <p className="mt-1 text-sm text-[#6B4A2B]">
          Recherchez, vérifiez, promouvez ou bannissez un compte propriétaire ou dog-sitter.
        </p>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="max-w-xs"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 rounded-2xl border border-[#E7D9C7] bg-white px-4 text-sm text-[#3E2A1B] focus:border-[#D2691E] focus:outline-none"
        >
          <option value="">Tous les types</option>
          <option value="owner">Propriétaires</option>
          <option value="sitter">Dog-sitters</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-2xl border border-[#E7D9C7] bg-white px-4 text-sm text-[#3E2A1B] focus:border-[#D2691E] focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="banned">Bannis</option>
          <option value="admin">Administrateurs</option>
        </select>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6B4A2B]">Aucun utilisateur ne correspond à cette recherche.</Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="flex flex-wrap items-center gap-4 p-4">
              <Avatar src={user.photo_path ? getImageUrl(user.photo_path) : null} alt={user.name} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#3E2A1B]">{user.name}</p>
                  <Badge>{user.type === "owner" ? "Propriétaire" : "Dog-sitter"}</Badge>
                  {user.is_admin && <Badge className="bg-[#FDECEC] text-[#B42323]">🔴 Admin</Badge>}
                  {user.is_banned && <Badge className="bg-[#FDECEC] text-[#B42323]">⛔ Banni</Badge>}
                  {user.is_verified && <Badge className="bg-[#E7F8EF] text-[#197A43]">✓ Vérifié</Badge>}
                </div>
                <p className="truncate text-sm text-[#A0522D]">{user.email}</p>
                {user.city && <p className="text-xs text-[#A0522D]">{user.city}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === user.id}
                  onClick={() => toggleVerified(user)}
                >
                  {user.is_verified ? "Retirer vérification" : "Vérifier"}
                </Button>
                {!user.is_banned && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === user.id}
                    onClick={() => toggleAdmin(user)}
                  >
                    {user.is_admin ? "Retirer admin" : "Promouvoir admin"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={user.is_banned ? "secondary" : "primary"}
                  className={user.is_banned ? "" : "bg-[#B42323] hover:bg-[#8f1c1c]"}
                  disabled={busyId === user.id}
                  onClick={() => toggleBan(user)}
                >
                  {user.is_banned ? "Débannir" : "Bannir"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
