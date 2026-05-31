"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

export function Composer({ onSend }: { onSend: (content: string) => void | Promise<void> }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!value.trim()) return;
    try {
      setSending(true);
      await onSend(value.trim());
      setValue("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#F1E5D4] bg-white p-4 shadow-sm">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={3}
        placeholder="Écrivez un petit mot…"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-[#A0522D]">Maj + Entrée pour aller à la ligne</p>
        <Button onClick={handleSend} disabled={sending}>
          {sending ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}
