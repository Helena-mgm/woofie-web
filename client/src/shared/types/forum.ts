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
  email?: string;
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
  user_id?: number;
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
  dogs?: Dog[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  post_id?: number;
  user: User;
  content: string;
  created_at: string;
  likes_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
  parent_id?: number;
  parent?: Comment;
}

export interface PostFilters {
  type?: 'all' | 'following' | 'dogs';
  sort?: 'recent' | 'popular';
}
