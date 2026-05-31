"use client";

import type { DogSitter } from "@/shared/types/forum";
import { ServiceCard } from "./ServiceCard";
import { Button } from "@/shared/ui/button";

interface ServicesGridProps {
  sitters: DogSitter[];
  onReset: () => void;
  isFallback?: boolean;
}

export function ServicesGrid({ sitters, onReset, isFallback = false }: ServicesGridProps) {
  if (isFallback) {
    return (
      <div className="space-y-4 rounded-3xl border border-[#F1E5D4] bg-white p-8 text-[#6B4A2B] shadow-sm">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-2xl">ℹ️</span>
          <p>
            Les résultats affichés sont des exemples. Ajoutez votre profil dog-sitter pour le rendre visible à la communauté.
          </p>
        </div>
        <div className="grid gap-4">
          {sitters.map((sitter) => (
            <ServiceCard key={sitter.id} sitter={sitter} />
          ))}
        </div>
      </div>
    );
  }

  if (sitters.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-[#F1E5D4] bg-white p-12 text-center text-[#6B4A2B] shadow-sm">
        <div className="text-5xl">🐾</div>
        <p className="mt-3 text-sm font-semibold">Aucun service ne correspond pour l’instant</p>
        <p className="mt-2 text-xs max-w-xs">
          Ajustez vos filtres pour découvrir d’autres promeneurs, dog-sitters et partenaires bien-être.
        </p>
        <Button className="mt-4" variant="secondary" onClick={onReset}>
          Réinitialiser les filtres
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {sitters.map((sitter) => (
        <ServiceCard key={sitter.id} sitter={sitter} />
      ))}
    </div>
  );
}

export default ServicesGrid;
