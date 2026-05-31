"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/presentation/hooks/useAuth";
import { FeedHero } from "./components/FeedHero";
import { useFeed } from "./hooks/useFeed";

const FilterTabs = dynamic(() => import("./components/FilterTabs"), {
  ssr: false,
  loading: () => <div className="h-10 w-60 rounded-full bg-white/70 animate-pulse" />,
});

const ComposerCard = dynamic(() => import("./components/ComposerCard"), {
  ssr: false,
  loading: () => <div className="h-48 rounded-[32px] bg-white/70 animate-pulse" />,
});

const FeedList = dynamic(() => import("./components/FeedList"), {
  ssr: false,
  loading: () => <FeedListSkeleton />,
});

export function CommunityFeedView() {
  const { user } = useAuth();
  const {
    posts,
    filters,
    filter,
    loading,
    setFilter,
    refresh,
    publish,
    likePost,
    addComment,
    dropPost,
    dropComment,
    respond,
    likeComment,
  } = useFeed();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-8">
      <FeedHero />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterTabs filters={filters} active={filter} onChange={setFilter} />
        <p className="text-sm text-[#A0522D]">
          {loading
            ? "Chargement des publications…"
            : `${posts.length} publication${posts.length > 1 ? 's' : ''} sélectionnée${posts.length > 1 ? 's' : ''} pour vous`}
        </p>
      </div>
      <ComposerCard author={user} onPublish={(content) => publish({ content })} />
      <FeedList
        posts={posts}
        onLike={likePost}
        onComment={addComment}
        onDelete={dropPost}
        onDeleteComment={dropComment}
        onReply={respond}
        onLikeComment={likeComment}
      />
    </div>
  );
}

function FeedListSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="h-64 rounded-[32px] bg-white/70 shadow-[0_20px_60px_-40px_rgba(139,69,19,0.45)] animate-pulse"
        />
      ))}
    </div>
  );
}
