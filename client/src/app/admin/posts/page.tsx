"use client";

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet } from "@/shared/lib/api";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/avatar";
import { getImageUrl } from "@/infrastructure/config/constants";

interface AdminPost {
  id: number;
  content: string;
  createdAt: string;
  user: { name: string; profilePicture: string | null; isAdmin: boolean };
  images: { id: number; path: string }[];
  likesCount: number;
  comments: unknown[];
}

const PAGE_SIZE = 20;

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPage = useCallback(async (offset: number) => {
    const { ok, data } = await apiGet(`/api/posts?limit=${PAGE_SIZE}&offset=${offset}`);
    if (ok && Array.isArray(data)) {
      const page = data as AdminPost[];
      setHasMore(page.length === PAGE_SIZE);
      return page;
    }
    setHasMore(false);
    return [];
  }, []);

  useEffect(() => {
    (async () => {
      const page = await fetchPage(0);
      setPosts(page);
      setLoading(false);
    })();
  }, [fetchPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    const page = await fetchPage(posts.length);
    setPosts((prev) => [...prev, ...page]);
    setLoadingMore(false);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    const { ok } = await apiDelete(`/api/posts/${id}`);
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3E2A1B]">Publications</h1>
        <p className="mt-1 text-sm text-[#6B4A2B]">
          Modérez les publications de la communauté. La suppression retire aussi les commentaires associés.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#6B4A2B]">Aucune publication pour le moment.</Card>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-wrap items-start gap-4 p-4">
                <Avatar
                  src={post.user.profilePicture ? getImageUrl(post.user.profilePicture) : null}
                  alt={post.user.name}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#3E2A1B]">{post.user.name}</p>
                    {post.user.isAdmin && (
                      <span className="rounded-full bg-[#FDECEC] px-2 py-0.5 text-xs font-semibold text-[#B42323]">
                        Admin
                      </span>
                    )}
                    <span className="text-xs text-[#A0522D]">
                      {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-[#3E2A1B]">{post.content}</p>
                  {post.images.length > 0 && (
                    <p className="text-xs text-[#A0522D]">
                      📷 {post.images.length} photo{post.images.length > 1 ? "s" : ""}
                    </p>
                  )}
                  <p className="text-xs text-[#A0522D]">
                    ❤️ {post.likesCount} · 💬 {post.comments.length}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-[#B42323] hover:bg-[#8f1c1c]"
                  disabled={deletingId === post.id}
                  onClick={() => handleDelete(post.id)}
                >
                  {deletingId === post.id ? "…" : "Supprimer"}
                </Button>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? "Chargement…" : "Charger plus"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
