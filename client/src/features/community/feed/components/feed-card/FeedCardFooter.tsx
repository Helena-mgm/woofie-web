"use client";

import { useState } from "react";
import type { Post } from "@/shared/types/forum";
import { FeedActions } from "./FeedActions";
import { CommentThread } from "./CommentThread";

type FeedCardFooterProps = {
  post: Post;
  onLike: () => void;
  onComment: (content: string) => void;
  onDeleteComment: (commentId: number) => void;
  onReply: (commentId: number, content: string) => void;
  onLikeComment: (commentId: number) => void;
};

export function FeedCardFooter({
  post,
  onLike,
  onComment,
  onDeleteComment,
  onReply,
  onLikeComment,
}: FeedCardFooterProps) {
  const [open, setOpen] = useState(post.comments_count > 0);

  return (
    <footer className="space-y-4">
      <FeedActions post={post} onLike={onLike} onCommentToggle={() => setOpen((prev) => !prev)} />
      {open && (
        <CommentThread
          comments={post.comments}
          onComment={onComment}
          onDelete={onDeleteComment}
          onReply={onReply}
          onLike={onLikeComment}
        />
      )}
    </footer>
  );
}
