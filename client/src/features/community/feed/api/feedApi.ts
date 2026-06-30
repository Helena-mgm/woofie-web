import { apiRequest } from "@/shared/lib/api";
import type { Post } from "@/shared/types/forum";
import { mapPostCollection, mapComment } from "../mappers/feedMappers";

export type MyDog = { id: number; name: string; breed: string; photo_path?: string };

export async function fetchFeed(): Promise<Post[]> {
  const response = await apiRequest("/api/posts");
  if (!response.ok) {
    throw new Error("Failed to load community feed");
  }
  const payload = (await response.json()) as unknown[];
  return mapPostCollection(payload);
}

export async function createPost(payload: {
  content: string;
  dogIds?: number[];
  images?: File[];
}) {
  const formData = new FormData();
  formData.append("content", payload.content);
  if (payload.dogIds?.length) {
    formData.append("dogIds", JSON.stringify(payload.dogIds));
  }
  payload.images?.forEach((file, index) => {
    formData.append(`image_${index}`, file);
  });

  const response = await apiRequest("/api/posts", { method: "POST", body: formData });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message ?? "Unable to publish post");
  }
}

export async function togglePostLike(postId: number) {
  const response = await apiRequest(`/api/posts/${postId}/like`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to update like");
  return response.json() as Promise<{ isLiked: boolean; likesCount: number }>;
}

export async function submitComment(postId: number, content: string) {
  const response = await apiRequest(`/api/posts/${postId}/comment`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("Unable to add comment");
  const payload = await response.json();
  return mapComment(payload);
}

export async function deletePost(postId: number) {
  const response = await apiRequest(`/api/posts/${postId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to delete post");
}

export async function deleteComment(postId: number, commentId: number) {
  const response = await apiRequest(`/api/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Unable to delete comment");
}

export async function replyToComment(postId: number, commentId: number, content: string) {
  const response = await apiRequest(`/api/posts/${postId}/comments/${commentId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error("Unable to reply to comment");
  const payload = await response.json();
  return mapComment(payload);
}

export async function toggleCommentLike(postId: number, commentId: number) {
  const response = await apiRequest(`/api/posts/${postId}/comments/${commentId}/like`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Unable to update comment like");
  return response.json() as Promise<{ isLiked: boolean; likesCount: number }>;
}

/** Chiens de l'utilisateur connecté — pour le tagger dans un post */
export async function fetchMyDogs(): Promise<MyDog[]> {
  try {
    const response = await apiRequest("/api/profile/dogs");
    if (!response.ok) return [];
    const data = await response.json() as Array<{ id: number; name?: string; nom?: string; breed?: string; race?: string; photo?: string; photo_path?: string }>;
    return Array.isArray(data)
      ? data.map((d) => ({
          id: d.id,
          name: d.name ?? d.nom ?? "?",
          breed: d.breed ?? d.race ?? "",
          photo_path: d.photo ?? d.photo_path,
        }))
      : [];
  } catch {
    return [];
  }
}

/** Recherche d'utilisateurs pour les @mentions */
export async function searchUsers(
  query: string
): Promise<Array<{ id: number; nom: string; prenom?: string; photo_path?: string }>> {
  try {
    const response = await apiRequest(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
