"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { getImageUrl } from "@/infrastructure/config/constants";
import type { UserProfile } from "@/presentation/hooks/useAuth";
import type { User } from "@/shared/types/forum";
import { fetchMyDogs, type MyDog } from "../api/feedApi";
import type { EmojiClickData } from "emoji-picker-react";

// Picker complet lazy-loadé (lourd, hors SSR)
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] w-80 animate-pulse rounded-2xl bg-white/80 border border-[#F1E5D4]" />
  ),
});

// Type interne pour le dropdown @ unifié (personnes + chiens)
type MentionItem =
  | { kind: "user"; id: number; name: string; city?: string; photo_path?: string }
  | { kind: "dog"; id: number; name: string; breed?: string; photo_path?: string; ownerName: string };

type ComposerCardProps = {
  author?: UserProfile | null;
  knownUsers?: User[];
  onPublish: (content: string, images?: File[]) => Promise<void>;
};

export function ComposerCard({ author, knownUsers = [], onPublish }: ComposerCardProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myDogs, setMyDogs] = useState<MyDog[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyDogs().then(setMyDogs).catch(() => {});
  }, []);

  // Ferme l'emoji picker si clic en dehors
  useEffect(() => {
    if (!showEmojiPicker) return;
    function onClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showEmojiPicker]);

  // Suggestions @ unifiées : personnes + chiens du propriétaire
  const ownerName = author
    ? author.prenom
      ? `${author.prenom} ${author.nom}`
      : author.nom
    : "Moi";

  const mentionSuggestions: MentionItem[] =
    mentionQuery !== null
      ? [
          ...knownUsers
            .filter((u) => {
              const full = `${u.prenom ?? ""} ${u.nom}`.toLowerCase();
              return full.includes(mentionQuery.toLowerCase()) && u.id !== author?.id;
            })
            .slice(0, 4)
            .map(
              (u): MentionItem => ({
                kind: "user",
                id: u.id,
                name: u.prenom ? `${u.prenom} ${u.nom}` : u.nom,
                city: u.city,
                photo_path: u.photo_path,
              })
            ),
          ...myDogs
            .filter((d) => d.name.toLowerCase().includes(mentionQuery.toLowerCase()))
            .slice(0, 4)
            .map(
              (d): MentionItem => ({
                kind: "dog",
                id: d.id,
                name: d.name,
                breed: d.breed,
                photo_path: d.photo_path,
                ownerName,
              })
            ),
        ].slice(0, 7)
      : [];

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    const cursor = e.target.selectionStart ?? newValue.length;
    const textBeforeCursor = newValue.slice(0, cursor);
    const match = /@([\wÀ-ÿ ]*)$/.exec(textBeforeCursor);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(match.index);
    } else {
      setMentionQuery(null);
    }
  }, []);

  const insertMentionItem = useCallback(
    (item: MentionItem) => {
      const tag =
        item.kind === "user"
          ? `@[${item.name}](${item.id})`
          : `#dog:[${item.name}](${item.id})`;
      const before = value.slice(0, mentionStart);
      const after = value.slice(mentionStart + 1 + (mentionQuery?.length ?? 0));
      const newVal = `${before}${tag} ${after}`;
      setValue(newVal);
      setMentionQuery(null);
      setTimeout(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          const pos = before.length + tag.length + 1;
          ta.setSelectionRange(pos, pos);
        }
      }, 0);
    },
    [value, mentionStart, mentionQuery]
  );

  const insertEmoji = useCallback(
    (emojiData: EmojiClickData) => {
      const emoji = emojiData.emoji;
      const ta = textareaRef.current;
      const pos = ta?.selectionStart ?? value.length;
      const newVal = value.slice(0, pos) + emoji + value.slice(pos);
      setValue(newVal);
      setShowEmojiPicker(false);
      setTimeout(() => {
        ta?.focus();
        ta?.setSelectionRange(pos + emoji.length, pos + emoji.length);
      }, 0);
    },
    [value]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - images.length) as File[];
    if (!files.length) return;
    setImages((prev: File[]) => [...prev, ...files]);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev: string[]) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
    setImagePreviews((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  };

  const handleSubmit = async () => {
    if (!value.trim() && images.length === 0) return;
    try {
      setSubmitting(true);
      await onPublish(value.trim(), images.length > 0 ? images : undefined);
      setValue("");
      setImages([]);
      setImagePreviews([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <Link href={author ? `/profile/${author.id}` : "#"} className="shrink-0">
          <Avatar
            src={getImageUrl(author?.photo_path)}
            alt={author?.nom ?? "Profil"}
            className="h-14 w-14 transition-opacity hover:opacity-80"
            placeholder={(author?.nom?.[0] ?? "W").toUpperCase()}
          />
        </Link>

        <div className="flex-1 space-y-3">
          {/* Zone de texte */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextChange}
              placeholder="Racontez une balade… Tapez @ pour mentionner quelqu'un ou un chien 🐾"
              rows={3}
              className="w-full resize-none rounded-2xl border border-[#F1E5D4] bg-[#FFF9F5] px-4 py-3 text-sm text-[#3E2A1B] placeholder-[#C9A87C] focus:border-[#8B4513] focus:outline-none"
            />

            {/* Dropdown @ unifié — personnes ET chiens */}
            {mentionQuery !== null && mentionSuggestions.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-2xl border border-[#F1E5D4] bg-white shadow-xl">
                <p className="border-b border-[#F1E5D4] px-4 py-2 text-xs font-semibold text-[#A0522D]">
                  Mentionner…
                </p>
                {mentionSuggestions.map((item) =>
                  item.kind === "user" ? (
                    <button
                      key={`u-${item.id}`}
                      type="button"
                      onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); insertMentionItem(item); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#FFF5E6]"
                    >
                      <Avatar
                        src={getImageUrl(item.photo_path)}
                        alt={item.name}
                        placeholder={item.name[0]}
                        className="h-9 w-9 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#3E2A1B]">{item.name}</p>
                        {item.city && (
                          <p className="text-xs text-[#A0522D]">{item.city}</p>
                        )}
                      </div>
                    </button>
                  ) : (
                    <button
                      key={`d-${item.id}`}
                      type="button"
                      onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); insertMentionItem(item); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#FFF5E6]"
                    >
                      {/* Photo du chien (ou patte si pas de photo) */}
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-[#F1E5D4] bg-[#FFF0E0]">
                        {item.photo_path ? (
                          // Image depuis le backend — URL blob/dynamique incompatible avec next/image sans domaine configuré
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(item.photo_path)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-lg">🐾</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#3E2A1B]">🐾 {item.name}</p>
                        <p className="text-xs text-[#A0522D]">
                          {item.breed ? `${item.breed} · ` : ""}
                          {item.ownerName}
                        </p>
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Prévisualisations des images */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((src, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#F1E5D4]"
                >
                  {/* Prévisualisation locale (URL blob) — next/image ne supporte pas les blob: URLs */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Barre d'outils */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {/* Upload image */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
              <button
                type="button"
                title="Ajouter des photos"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 4}
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[#FFF0E0] disabled:opacity-40"
              >
                📷
              </button>

              {/* Emoji picker complet */}
              <div className="relative" ref={emojiRef}>
                <button
                  type="button"
                  title="Ajouter un emoji"
                  onClick={() => setShowEmojiPicker((p) => !p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-[#FFF0E0] ${
                    showEmojiPicker ? "bg-[#FFF0E0]" : ""
                  }`}
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 z-50 mb-2">
                    <EmojiPicker
                      onEmojiClick={insertEmoji}
                      searchPlaceholder="Rechercher un emoji…"
                      lazyLoadEmojis
                      height={420}
                      width={320}
                    />
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || (!value.trim() && images.length === 0)}
              size="md"
            >
              {submitting ? "Envoi…" : "Partager"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ComposerCard;
