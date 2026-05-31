import { apiRequest } from "@/shared/lib/api-v2";
import type { Post } from "@/shared/types/forum";
import { mapPostCollection, mapComment } from "../mappers/feedMappers";

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
