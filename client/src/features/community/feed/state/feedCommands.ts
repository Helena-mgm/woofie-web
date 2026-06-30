import type { FeedAction, FeedState } from "./feedState";
import {
  createPost,
  deleteComment,
  deletePost,
  fetchFeed,
  replyToComment,
  submitComment,
  toggleCommentLike,
  togglePostLike,
} from "../api/feedApi";

export const loadFeed = async (dispatch: (action: FeedAction) => void) => {
  dispatch({ type: "setLoading", payload: true });
  try {
    const posts = await fetchFeed();
    dispatch({ type: "setPosts", payload: posts });
  } finally {
    dispatch({ type: "setLoading", payload: false });
  }
};

export const publishPost = async (
  dispatch: (action: FeedAction) => void,
  payload: { content: string; dogIds?: number[]; images?: File[] }
) => {
  dispatch({ type: "setLoading", payload: true });
  try {
    await createPost(payload);
    const posts = await fetchFeed();
    dispatch({ type: "setPosts", payload: posts });
  } finally {
    dispatch({ type: "setLoading", payload: false });
  }
};

export const likeFeedPost = async (
  dispatch: (action: FeedAction) => void,
  state: FeedState,
  postId: number
) => {
  const next = await togglePostLike(postId);
  const target = state.posts.find((post) => post.id === postId);
  if (!target) return;
  dispatch({
    type: "updatePost",
    payload: { ...target, is_liked: next.isLiked, likes_count: next.likesCount },
  });
};

export const createFeedComment = async (
  dispatch: (action: FeedAction) => void,
  postId: number,
  content: string
) => {
  const comment = await submitComment(postId, content);
  dispatch({ type: "appendComment", payload: { postId, comment } });
};

export const removeFeedPost = async (dispatch: (action: FeedAction) => void, postId: number) => {
  await deletePost(postId);
  dispatch({ type: "removePost", payload: postId });
};

export const removeFeedComment = async (
  dispatch: (action: FeedAction) => void,
  postId: number,
  commentId: number
) => {
  await deleteComment(postId, commentId);
  dispatch({ type: "removeComment", payload: { postId, commentId } });
};

export const replyToFeedComment = async (
  dispatch: (action: FeedAction) => void,
  postId: number,
  commentId: number,
  content: string
) => {
  const reply = await replyToComment(postId, commentId, content);
  dispatch({ type: "appendReply", payload: { postId, commentId, reply } });
};

export const likeFeedComment = async (
  dispatch: (action: FeedAction) => void,
  postId: number,
  commentId: number
) => {
  const { isLiked, likesCount } = await toggleCommentLike(postId, commentId);
  dispatch({
    type: "updateCommentReaction",
    payload: { postId, commentId, likes: likesCount, liked: isLiked },
  });
};
