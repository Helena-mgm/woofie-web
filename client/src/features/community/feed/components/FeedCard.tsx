"use client";

import type { Post } from "@/shared/types/forum";
import { Card } from "@/shared/ui/card";
import { FeedCardHeader } from "./feed-card/FeedCardHeader";
import { FeedCardBody } from "./feed-card/FeedCardBody";
import { FeedCardFooter } from "./feed-card/FeedCardFooter";

type FeedCardProps = {
  post: Post;
  onLike: () => void;
  onComment: (content: string) => void;
  onDelete: () => void;
  onDeleteComment: (commentId: number) => void;
  onReply: (commentId: number, content: string) => void;
  onLikeComment: (commentId: number) => void;
};

export function FeedCard({
  post,
  onLike,
  onComment,
  onDelete,
  onDeleteComment,
  onReply,
  onLikeComment,
}: FeedCardProps) {
  return (
    <Card className="space-y-6 p-6 sm:p-8">
      <FeedCardHeader post={post} onDelete={onDelete} />
      <FeedCardBody post={post} />
      <FeedCardFooter
        post={post}
        onLike={onLike}
        onComment={onComment}
        onDeleteComment={onDeleteComment}
        onReply={onReply}
        onLikeComment={onLikeComment}
      />
    </Card>
  );
}
