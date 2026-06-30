/**
 * Types pour le forum / réseau social Woofie
 */

export interface Dog {
  id: number;
  name: string;
  breed: string;
  age: number;
  photo_path?: string;
  owner_id: number;
  icad_number?: string;
}

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom?: string;
  photo_path?: string;
  type: 'owner' | 'dogsitter';
  bio?: string;
  city?: string;
  created_at?: string;
  telephone?: string;
}

export interface DogSitter extends User {
  type: 'dogsitter';
  user_id?: number; // ID de l'entité User (utilisé pour les conversations)
  rating?: number;
  reviews_count?: number;
  price_per_hour?: number;
  services?: string[];
  availability?: boolean;
  experience_years?: number;
  is_verified?: boolean;
}

export interface Post {
  id: number;
  user: User;
  content: string;
  images?: string[];
  dogs?: Dog[]; // Chiens mentionnés dans le post
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  comments?: Comment[]; // Ajout des commentaires
}

export interface Comment {
  id: number;
  post_id?: number;
  user: User;
  content: string;
  created_at: string;
  likes_count?: number;
  is_liked?: boolean;
  replies?: Comment[]; // Nested replies
  parent_id?: number; // Reference to parent comment
  parent?: Comment; // Parent comment data for @mention
}

export interface PostFilters {
  type?: 'all' | 'following' | 'dogs';
  sort?: 'recent' | 'popular';
}
