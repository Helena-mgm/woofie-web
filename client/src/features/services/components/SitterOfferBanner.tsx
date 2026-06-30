"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/shared/ui/button";

const SitterOfferModal = dynamic(() => import("./SitterOfferModal"), {
  ssr: false,
});

export function SitterOfferBanner() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  // Afficher seulement pour les sitters connectés
  if (loading || !user || user.type !== "sitter") return null;

  const hasBio = !!user.bio?.trim();
  const isAvailable = user.is_available;
  const services = user.services ?? [];

  return (
    <>
      <div className="rounded-3xl border border-[#D2691E]/30 bg-gradient-to-r from-[#FFF5E6] to-[#FFE8CC] p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">🐕‍🦺</span>
            <div className="min-w-0">
              <p className="font-semibold text-[#8B4513]">
                {hasBio ? "Votre annonce dog-sitter" : "Proposez vos services"}
              </p>
              {hasBio ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-semibold ${
                      isAvailable
                        ? "bg-[#E7F8EF] text-[#197A43]"
                        : "bg-[#FDECEC] text-[#B42323]"
                    }`}
                  >
                    {isAvailable ? "✓ Disponible" : "✗ Complet"}
                  </span>
                  {services.length > 0 && (
                    <span className="truncate text-[#6B4A2B]">
                      {services.join(" · ")}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-[#6B4A2B]">
                  Complétez votre profil pour apparaître dans cette liste et
                  être contacté par les propriétaires.
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="shrink-0 self-start sm:self-auto"
          >
            {hasBio ? "Gérer mon annonce" : "Proposer mes services"}
          </Button>
        </div>
      </div>

      {open && (
        <SitterOfferModal
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default SitterOfferBanner;
