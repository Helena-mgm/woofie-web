"use client";

import { useState } from "react";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { getImageUrl } from "@/infrastructure/config/constants";
import type { UserProfile } from "@/presentation/hooks/useAuth";

type ComposerCardProps = {
  author?: UserProfile | null;
  onPublish: (content: string) => Promise<void>;
};

export function ComposerCard({ author, onPublish }: ComposerCardProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    try {
      setSubmitting(true);
      await onPublish(value.trim());
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <Avatar
          src={getImageUrl(author?.photo_path)}
          alt={author?.nom ?? "Profil"}
          className="h-14 w-14"
          placeholder={(author?.nom?.[0] ?? "W").toUpperCase()}
        />
        <div className="flex-1 space-y-4">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Racontez une balade, un succès ou posez une question à la meute…"
            rows={3}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[#A0522D]">
              <span className="rounded-full bg-[#FFF0E0] px-3 py-1">#woofie</span>
              <span className="rounded-full bg-[#FFF0E0] px-3 py-1">#balade</span>
            </div>
            <Button onClick={handleSubmit} disabled={submitting} size="md">
              {submitting ? "Envoi…" : "Partager"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ComposerCard;
