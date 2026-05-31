import type { Comment, Post } from "@/shared/types/forum";
import { cascadeRemove, cascadeUpdate } from "./feedTree";

export type FeedFilter = "all" | "following";

export type FeedState = {
  posts: Post[];
  filter: FeedFilter;
  loading: boolean;
};

export type FeedAction =
  | { type: "setLoading"; payload: boolean }
  | { type: "setPosts"; payload: Post[] }
  | { type: "setFilter"; payload: FeedFilter }
  | { type: "updatePost"; payload: Post }
  | { type: "removePost"; payload: number }
  | { type: "appendComment"; payload: { postId: number; comment: Comment } }
  | { type: "removeComment"; payload: { postId: number; commentId: number } }
  | {
      type: "appendReply";
      payload: { postId: number; commentId: number; reply: Comment };
    }
  | {
      type: "updateCommentReaction";
      payload: { postId: number; commentId: number; likes: number; liked: boolean };
    };

export const initialFeedState: FeedState = {
  posts: [],
  filter: "all",
  loading: true,
};

export function feedReducer(state: FeedState, action: FeedAction): FeedState {
  switch (action.type) {
    case "setLoading":
      return { ...state, loading: action.payload };
    case "setPosts":
      return { ...state, posts: action.payload };
    case "setFilter":
      return { ...state, filter: action.payload };
    case "updatePost":
      return {
        ...state,
        posts: state.posts.map((post) => (post.id === action.payload.id ? action.payload : post)),
      };
    case "removePost":
      return { ...state, posts: state.posts.filter((post) => post.id !== action.payload) };
    case "appendComment":
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.postId
            ? {
                ...post,
                comments_count: post.comments_count + 1,
                comments: [...(post.comments ?? []), action.payload.comment],
              }
            : post
        ),
      };
    case "removeComment":
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.postId
            ? {
                ...post,
                comments_count: Math.max(0, post.comments_count - 1),
                comments: cascadeRemove(post.comments ?? [], action.payload.commentId),
              }
            : post
        ),
      };
    case "appendReply":
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.postId
            ? {
                ...post,
                comments_count: post.comments_count + 1,
                comments: cascadeUpdate(
                  post.comments ?? [],
                  (comment) => comment.id === action.payload.commentId,
                  (comment) => ({
                    ...comment,
                    replies: [...(comment.replies ?? []), action.payload.reply],
                  })
                ),
              }
            : post
        ),
      };
    case "updateCommentReaction":
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.postId
            ? {
                ...post,
                comments: cascadeUpdate(
                  post.comments ?? [],
                  (comment) => comment.id === action.payload.commentId,
                  (comment) => ({
                    ...comment,
                    is_liked: action.payload.liked,
                    likes_count: action.payload.likes,
                  })
                ),
              }
            : post
        ),
      };
    default:
      return state;
  }
}
