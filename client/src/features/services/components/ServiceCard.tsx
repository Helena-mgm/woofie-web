"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DogSitter } from "@/shared/types/forum";
import type { Conversation } from "@/shared/types/chat";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { apiGet, apiPost } from "@/shared/lib/api";
import { useAuth } from "@/presentation/hooks/useAuth";

export function ServiceCard({ sitter }: { sitter: DogSitter }) {
  const router = useRouter();
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);

  const hourlyRate =
    typeof sitter.price_per_hour === 'number'
      ? sitter.price_per_hour
      : Number(sitter.price_per_hour ?? 0);

  const handleContact = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Le backend retourne user_id (ID de l'entité User) et id (ID du sitter)
    const targetUserId = sitter.user_id ?? sitter.id;

    setStarting(true);
    try {
      // Chercher une conversation directe existante avec ce sitter
      const { ok, data } = await apiGet('/api/conversations');
      let conversationId: number | null = null;

      if (ok && Array.isArray(data)) {
        const existing = (data as Conversation[]).find(
          (conv) =>
            conv.type === 'direct' &&
            conv.participants.some((p) => p.id === targetUserId)
        );
        if (existing) conversationId = existing.id;
      }

      // Créer une nouvelle conversation si elle n'existe pas encore
      if (!conversationId) {
        const res = await apiPost('/api/conversations', {
          type: 'direct',
          participantIds: [targetUserId],
        });
        if (res.ok && res.data) {
          conversationId = (res.data as Conversation).id;
        }
      }

      if (conversationId) {
        // Stocker l'ID pour que MessagesView l'ouvre automatiquement
        sessionStorage.setItem('openConversation', String(conversationId));
        router.push('/messages');
      }
    } catch (err) {
      console.error('[ServiceCard] handleContact', err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF5E6] text-2xl">
        🐾
      </div>
      <div className="flex-1 space-y-2 text-sm text-[#3E2A1B]">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-[#8B4513]">
              {sitter.prenom} {sitter.nom}
            </p>
            <p className="text-xs text-[#A0522D]">{sitter.city}</p>
          </div>
          <div className="flex items-center gap-2">
            {sitter.availability !== undefined && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  sitter.availability ? 'bg-[#E7F8EF] text-[#197A43]' : 'bg-[#FDECEC] text-[#B42323]'
                }`}
              >
                {sitter.availability ? 'Disponible' : 'Complet'}
              </span>
            )}
            <div className="rounded-full bg-[#FFF0E0] px-3 py-1 text-xs text-[#A0522D]">
              €{hourlyRate.toFixed(2)} /h
            </div>
          </div>
        </header>
        <p className="leading-relaxed text-[#6B4A2B]">
          {sitter.bio || 'Ce dog-sitter complétera sa présentation prochainement.'}
        </p>
        {sitter.experience_years !== undefined && sitter.experience_years !== null && (
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]">
            Expérience : {sitter.experience_years} an{(sitter.experience_years ?? 0) > 1 ? 's' : ''}
          </p>
        )}
        {sitter.services && (
          <ul className="flex flex-wrap gap-2 text-xs text-[#8B4513]">
            {sitter.services.map((service) => (
              <li key={service} className="rounded-full bg-[#FFF5E6] px-3 py-1">
                {service}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-xs text-[#A0522D]">
          ⭐ {sitter.rating?.toFixed(1) ?? "4.5"} ({sitter.reviews_count ?? 0} avis)
        </p>
        <Button size="sm" onClick={handleContact} disabled={starting}>
          {starting ? 'Chargement…' : 'Écrire un message'}
        </Button>
      </div>
    </Card>
  );
}

export default ServiceCard;
