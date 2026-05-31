"use client";

import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

export function EmptyFeedState() {
  return (
    <Card className="flex flex-col items-center gap-4 p-12 text-center">
      <div className="text-6xl">🐾</div>
      <h2 className="text-2xl font-semibold text-[#3E2A1B]">
        La meute attend votre premier partage
      </h2>
      <p className="max-w-sm text-sm text-[#6B4A2B]">
        Publiez un petit mot, partagez un nouveau tour ou lancez une idée de sortie. La communauté répond vite.
      </p>
      <Button size="lg">Lancer la conversation</Button>
    </Card>
  );
}
