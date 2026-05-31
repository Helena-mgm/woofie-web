"use client";

import type { Message } from "@/shared/types/chat";
import { cn } from "@/shared/lib/cn";
import ReactMarkdown from "react-markdown";

export function MessageBubble({ message, isOwn }: { message: Message; isOwn?: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-3xl px-5 py-3 text-sm shadow-sm",
          isOwn
            ? "bg-[#D2691E] text-white"
            : "bg-[#FFF5E6] text-[#3E2A1B] prose-strong:text-[#8B4513] prose-a:text-[#D2691E] prose-code:text-[#D2691E]"
        )}
      >
        {message.type === 'bot' ? (
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-[#3E2A1B] prose-strong:text-[#8B4513] prose-a:text-[#D2691E] prose-code:text-[#D2691E]">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        <span className={cn("mt-1 block text-[11px]",
          isOwn ? "text-white/80" : "text-[#B17A4B]")}
        >
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
