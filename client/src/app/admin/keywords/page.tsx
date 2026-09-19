"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiDelete, apiGet, apiPost } from "@/shared/lib/api";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface Keyword {
  id: number;
  keyword: string;
}

export default function AdminKeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchKeywords = async () => {
    const { ok, data } = await apiGet("/api/admin/forbidden_keywords");
    if (ok && data && Array.isArray((data as { keywords: Keyword[] }).keywords)) {
      setKeywords((data as { keywords: Keyword[] }).keywords);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    const { ok, data } = await apiPost("/api/admin/forbidden_keywords", { keyword: trimmed });
    if (ok) {
      setNewKeyword("");
      await fetchKeywords();
    } else {
      setError((data as { error?: string } | null)?.error ?? "Impossible d'ajouter ce mot.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    const { ok } = await apiDelete(`/api/admin/forbidden_keywords/${id}`);
    if (ok) {
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3E2A1B]">Mots interdits</h1>
        <p className="mt-1 text-sm text-[#6B4A2B]">
          Les publications et commentaires contenant un de ces mots sont automatiquement bloqués.
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-3">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Ajouter un mot interdit…"
            className="max-w-xs"
          />
          <Button type="submit" disabled={submitting || !newKeyword.trim()}>
            {submitting ? "Ajout…" : "Ajouter"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-[#B42323]">{error}</p>}
      </Card>

      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-white/70" />
      ) : keywords.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6B4A2B]">Aucun mot interdit configuré.</Card>
      ) : (
        <Card className="flex flex-wrap gap-2 p-4">
          {keywords.map((k) => (
            <span
              key={k.id}
              className="flex items-center gap-2 rounded-full bg-[#FFF5E6] py-1.5 pl-4 pr-2 text-sm font-medium text-[#8B4513]"
            >
              {k.keyword}
              <button
                onClick={() => handleDelete(k.id)}
                disabled={deletingId === k.id}
                className="flex h-5 w-5 items-center justify-center rounded-full text-[#B42323] hover:bg-[#FDECEC] disabled:opacity-50"
                aria-label={`Supprimer ${k.keyword}`}
              >
                ×
              </button>
            </span>
          ))}
        </Card>
      )}
    </div>
  );
}
