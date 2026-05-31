"use client";

import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Composer({ onSend }: { onSend: (content: string) => void | Promise<void> }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!value.trim() || sending) return;
    const contentToSend = value.trim();
    try {
      setSending(true);
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await onSend(contentToSend);
    } catch (error) {
      setValue(contentToSend);
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-grow
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        rows={1}
        disabled={sending}
        placeholder="Écrivez un message… (Entrée pour envoyer)"
        className={cn(
          "flex-1 resize-none rounded-2xl border border-[#EDE0D0] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#3E2A1B]",
          "outline-none transition focus:border-[#D2691E] focus:bg-white placeholder:text-[#C0A080]",
          "disabled:opacity-60"
        )}
        style={{ height: "42px", maxHeight: "160px" }}
      />
      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={!value.trim() || sending}
        aria-label="Envoyer"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
          value.trim() && !sending
            ? "bg-[#D2691E] text-white shadow-sm hover:bg-[#B8571A]"
            : "bg-[#F0E4D4] text-[#C0A080] cursor-not-allowed"
        )}
      >
        <ArrowUp size={17} strokeWidth={2.5} />
      </button>
    </div>
  );
}

