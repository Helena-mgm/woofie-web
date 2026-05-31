"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { getImageUrl } from "@/infrastructure/config/constants";
import { Avatar } from "@/shared/ui/avatar";
import type { Post } from "@/shared/types/forum";
import { Button } from "@/shared/ui/button";

type FeedCardHeaderProps = {
  post: Post;
  onDelete: () => void;
};

export function FeedCardHeader({ post, onDelete }: FeedCardHeaderProps) {
  const createdAtLabel = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <Avatar
          src={getImageUrl(post.user.photo_path)}
          alt={post.user.nom}
          placeholder={post.user.nom.charAt(0)}
        />
        <div>
          <p className="text-sm font-semibold text-[#3E2A1B]">{post.user.nom}</p>
          <p className="text-xs text-[#A0522D]">{createdAtLabel}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        Supprimer
      </Button>
    </header>
  );
}
