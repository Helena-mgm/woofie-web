"use client";

import { Badge } from "@/shared/ui/badge";

export function ServicesHero() {
  return (
    <section className="rounded-[36px] bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] p-8 sm:p-12">
      <Badge>Services</Badge>
      <div className="mt-6 space-y-6 text-[#3E2A1B]">
        <h1 className="text-4xl font-bold sm:text-5xl">Trouvez la perle rare pour votre chien</h1>
        <p className="max-w-2xl text-sm text-[#6B4A2B]">
          Promeneurs, dog-sitters et spécialistes sélectionnés par l’équipe Woofie. Choisissez un service et contactez-les en quelques secondes.
        </p>
      </div>
    </section>
  );
}
