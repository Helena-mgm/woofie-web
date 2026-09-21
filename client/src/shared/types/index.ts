export type UserType = 'owner' | 'sitter';

export interface User {
  id: number;
  email: string;
  type: UserType;
  roles: string[];
}

export interface AuthResponse {
  success?: boolean;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  status: number;
}

export interface LoginFormData extends Record<string, unknown> {
  identifier: string;
  password: string;
}

export interface DogInfo {
  icadNumber: string;
  nom: string;
  sexe: 'male' | 'female' | '';
  race: string;
  dateNaissance: string;
  photos: File[];
}

export interface OwnerRegisterFormData extends Record<string, unknown> {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  dogs: DogInfo[];
  ville: string;
  photo?: File | null;
}

export interface SitterRegisterFormData extends Record<string, unknown> {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  ville: string;
  siret: string;
  photo?: File | null;
  isVerified?: boolean;
  bio: string;
  services: string[];
  price_per_hour: number | '';
  is_available: boolean;
  experience_years: number | '';
}

export interface RegisterFormData extends Record<string, unknown> {
  type: 'owner' | 'sitter';
}

export interface DogAnimationState {
  isPasswordFocused: boolean;
  isEmailFocused: boolean;
  showPassword: boolean;
  error: string;
  success: string;
}

export interface Dog {
  id: number;
  nom: string;
  race: string | null;
  dateNaissance: string | null;
  sexe: string | null;
  icad_number?: string;
  description?: string | null;
  photoPath: string | null;
  owner_id?: number;
}

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  address: string;
}
