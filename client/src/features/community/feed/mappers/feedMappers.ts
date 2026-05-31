import type { Post, Comment } from "@/shared/types/forum";

type ApiUser = {
  id: number;
  email: string;
  owner?: { nom: string; profilePicture?: string; ville?: string };
};

type ApiComment = {
  id: number;
  content: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
  user: ApiUser;
  replies?: ApiComment[];
  parent?: { id: number };
};

type ApiPost = {
  id: number;
  content: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
  images?: Array<{ path: string }>;
  dogs?: Array<{ id: number; nom: string; race?: string }>;
  comments?: ApiComment[];
  user: ApiUser;
};

const mapUser = (user: ApiUser) => ({
  id: user.id,
  email: user.email,
  nom: user.owner?.nom ?? "Woofie Friend",
  prenom: "",
  photo_path: user.owner?.profilePicture,
  type: "owner" as const,
  city: user.owner?.ville,
});

export const mapComment = (comment: ApiComment): Comment => ({
  id: comment.id,
  user: mapUser(comment.user),
  content: comment.content,
  created_at: comment.createdAt,
  likes_count: comment.likesCount ?? 0,
  is_liked: comment.isLiked ?? false,
  parent_id: comment.parent?.id,
  replies: comment.replies?.map(mapComment) ?? [],
});

export const mapPost = (post: ApiPost): Post => ({
  id: post.id,
  content: post.content,
  created_at: post.createdAt,
  likes_count: post.likesCount ?? 0,
  comments_count: post.comments?.length ?? 0,
  shares_count: 0,
  is_liked: post.isLiked ?? false,
  is_saved: false,
  images: post.images?.map((image) => image.path) ?? [],
  dogs: post.dogs?.map((dog) => ({
    id: dog.id,
    name: dog.nom,
    breed: dog.race ?? "",
    age: 0,
    owner_id: mapUser(post.user).id,
  })) ?? [],
  user: mapUser(post.user),
  comments: post.comments?.map(mapComment) ?? [],
});

export const mapPostCollection = (payload: unknown[]): Post[] =>
  payload.filter(Boolean).map((item) => mapPost(item as ApiPost));
