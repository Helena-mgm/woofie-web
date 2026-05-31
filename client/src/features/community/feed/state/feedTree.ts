import type { Comment } from "@/shared/types/forum";

export const cascadeUpdate = (
  comments: Comment[],
  predicate: (comment: Comment) => boolean,
  projector: (comment: Comment) => Comment
): Comment[] =>
  comments.map((comment) => {
    if (predicate(comment)) {
      return projector(comment);
    }
    return {
      ...comment,
      replies: cascadeUpdate(comment.replies ?? [], predicate, projector),
    };
  });

export const cascadeRemove = (comments: Comment[], id: number): Comment[] =>
  comments
    .filter((comment) => comment.id !== id)
    .map((comment) => ({
      ...comment,
      replies: cascadeRemove(comment.replies ?? [], id),
    }));
