"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/presentation/hooks/useAuth";
import { FeedHero } from "./components/FeedHero";
import { useFeed } from "./hooks/useFeed";
import type { User } from "@/shared/types/forum";

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

  // FeedHero affiché une seule fois par utilisateur (premier passage)
  const [showHero, setShowHero] = useState(false);
  useEffect(() => {
    if (!user) return;
    const key = `woofie_welcomed_${user.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setShowHero(true);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Utilisateurs connus pour les @mentions dans le compositeur
  const knownUsers = useMemo<User[]>(() => {
    const map = new Map<number, User>();
    posts.forEach((post) => {
      if (!map.has(post.user.id)) map.set(post.user.id, post.user);
      post.comments?.forEach((c) => {
        if (!map.has(c.user.id)) map.set(c.user.id, c.user);
      });
    });
    return Array.from(map.values());
  }, [posts]);

  return (
    <div className="space-y-8">
      {showHero && <FeedHero />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterTabs filters={filters} active={filter} onChange={setFilter} />
        <p className="text-sm text-[#A0522D]">
          {loading
            ? "Chargement des publications…"
            : `${posts.length} publication${posts.length > 1 ? "s" : ""} sélectionnée${posts.length > 1 ? "s" : ""} pour vous`}
        </p>
      </div>
      <ComposerCard
        author={user}
        knownUsers={knownUsers}
        onPublish={(content: string, images?: File[]) =>
          publish({ content, images })
        }
      />
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
