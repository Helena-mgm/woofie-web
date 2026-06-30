"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getImageUrl } from "@/infrastructure/config/constants";
import { Avatar } from "@/shared/ui/avatar";
import type { Post } from "@/shared/types/forum";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/presentation/hooks/useAuth";

type FeedCardHeaderProps = {
  post: Post;
  onDelete: () => void;
};

export function FeedCardHeader({ post, onDelete }: FeedCardHeaderProps) {
  const { user } = useAuth();
  const isOwner = user?.id === post.user.id;

  const createdAtLabel = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: fr,
  });

  const fullName = post.user.prenom
    ? `${post.user.prenom} ${post.user.nom}`
    : post.user.nom;

  return (
    <header className="flex items-start justify-between gap-4">
      <Link href={`/profile/${post.user.id}`} className="flex items-start gap-4 group">
        <Avatar
          src={getImageUrl(post.user.photo_path)}
          alt={fullName}
          placeholder={post.user.nom.charAt(0)}
          className="transition-opacity group-hover:opacity-80"
        />
        <div>
          <p className="text-sm font-semibold text-[#3E2A1B] group-hover:underline">{fullName}</p>
          <p className="text-xs text-[#A0522D]">{createdAtLabel}</p>
        </div>
      </Link>
      {isOwner && (
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Supprimer
        </Button>
      )}
    </header>
  );
}
