import { useCallback, useMemo, useReducer } from "react";
import type { FeedFilter } from "../state/feedState";
import { feedReducer, initialFeedState } from "../state/feedState";
import {
  createFeedComment,
  likeFeedComment,
  likeFeedPost,
  loadFeed,
  publishPost,
  removeFeedComment,
  removeFeedPost,
  replyToFeedComment,
} from "../state/feedCommands";

const filters: Array<{ id: FeedFilter; label: string }> = [
  { id: "all", label: "Toute la communauté" },
  { id: "following", label: "Mes abonnements" },
];

export function useFeed() {
  const [state, dispatch] = useReducer(feedReducer, initialFeedState);

  const refresh = useCallback(() => loadFeed(dispatch), []);
  const publish = useCallback(
    (payload: { content: string; images?: File[] }) => publishPost(dispatch, payload),
    []
  );
  const likePost = useCallback(
    (postId: number) => likeFeedPost(dispatch, state, postId),
    [state]
  );
  const addComment = useCallback(
    (postId: number, content: string) => createFeedComment(dispatch, postId, content),
    []
  );
  const dropPost = useCallback((postId: number) => removeFeedPost(dispatch, postId), []);
  const dropComment = useCallback(
    (postId: number, commentId: number) => removeFeedComment(dispatch, postId, commentId),
    []
  );
  const respond = useCallback(
    (postId: number, commentId: number, content: string) =>
      replyToFeedComment(dispatch, postId, commentId, content),
    []
  );
  const likeComment = useCallback(
    (postId: number, commentId: number) => likeFeedComment(dispatch, postId, commentId),
    []
  );

  const filterMeta = useMemo(() => filters, []);
  const posts = useMemo(
    () => (state.filter === "all" ? state.posts : state.posts),
    [state.filter, state.posts]
  );

  return {
    posts,
    filters: filterMeta,
    filter: state.filter,
    loading: state.loading,
    setFilter: (value: FeedFilter) => dispatch({ type: "setFilter", payload: value }),
    refresh,
    publish,
    likePost,
    addComment,
    dropPost,
    dropComment,
    respond,
    likeComment,
  };
}
