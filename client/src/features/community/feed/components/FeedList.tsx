"use client";

import type { Post } from "@/shared/types/forum";
import { FeedCard } from "./FeedCard";
import { EmptyFeedState } from "./EmptyFeedState";

type FeedListProps = {
  posts: Post[];
  onLike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onDelete: (postId: number) => void;
  onDeleteComment: (postId: number, commentId: number) => void;
  onReply: (postId: number, commentId: number, content: string) => void;
  onLikeComment: (postId: number, commentId: number) => void;
};

export function FeedList({
  posts,
  onLike,
  onComment,
  onDelete,
  onDeleteComment,
  onReply,
  onLikeComment,
}: FeedListProps) {
  if (posts.length === 0) {
    return <EmptyFeedState />;
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <FeedCard
          key={post.id}
          post={post}
          onLike={() => onLike(post.id)}
          onComment={(content) => onComment(post.id, content)}
          onDelete={() => onDelete(post.id)}
          onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
          onReply={(commentId, content) => onReply(post.id, commentId, content)}
          onLikeComment={(commentId) => onLikeComment(post.id, commentId)}
        />
      ))}
    </div>
  );
}

export default FeedList;
