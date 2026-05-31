"use client";

import { Button } from "@/shared/ui/button";
import type { Post } from "@/shared/types/forum";

type FeedActionsProps = {
  post: Post;
  onLike: () => void;
  onCommentToggle: () => void;
};

export function FeedActions({ post, onLike, onCommentToggle }: FeedActionsProps) {
  return (
    <div className="flex items-center justify-between rounded-full bg-[#FFF5E6] px-4 py-2 text-sm text-[#8B4513]">
      <button
        type="button"
        onClick={onLike}
        className="flex items-center gap-2 font-semibold transition hover:text-[#D2691E]"
      >
        <span>{post.is_liked ? "💛" : "🤎"}</span>
        {post.likes_count} j’aime
      </button>
      <button
        type="button"
        onClick={onCommentToggle}
        className="flex items-center gap-2 font-semibold transition hover:text-[#D2691E]"
      >
        💬 {post.comments_count} réponse{post.comments_count > 1 ? 's' : ''}
      </button>
      <Button variant="ghost" size="sm">
        Partager
      </Button>
    </div>
  );
}
