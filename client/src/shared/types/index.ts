// Types pour l'authentification
export type UserType = 'owner' | 'sitter';

export interface User {
  id: number;
  email: string;
  type: UserType;
  roles: string[];
}

export interface AuthResponse {
  token?: string;
  error?: string;
}

// Types pour l'API
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  status: number;
}

// Formulaires - Login
export interface LoginFormData extends Record<string, unknown> {
  identifier: string; // Email OU numéro de téléphone
  password: string;
}

// Informations complètes d'un chien
export interface DogInfo {
  icadNumber: string;
  nom: string;
  sexe: 'male' | 'female' | '';
  race: string;
  dateNaissance: string;
  photos: File[]; // Plusieurs photos possible
}

// Formulaires - Register Owner (maître de chien)
export interface OwnerRegisterFormData extends Record<string, unknown> {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  dogs: DogInfo[]; // Informations complètes des chiens
  ville: string;
  photo?: File | null;
}

// Formulaires - Register Sitter (dog-sitter)
export interface SitterRegisterFormData extends Record<string, unknown> {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  ville: string;
  siret: string; // Numéro SIRET obligatoire pour dog-sitter
  photo?: File | null;
  isVerified?: boolean; // false par défaut, admins valident manuellement
  bio: string;
  services: string[];
  price_per_hour: number | '';
  is_available: boolean;
  experience_years: number | '';
}

// Type combiné pour le formulaire d'inscription
export interface RegisterFormData extends Record<string, unknown> {
  type: 'owner' | 'sitter';
  // Les champs spécifiques seront ajoutés conditionnellement
}

// Types pour les animations
export interface DogAnimationState {
  isPasswordFocused: boolean;
  isEmailFocused: boolean;
  showPassword: boolean;
  error: string;
  success: string;
}

// Types pour les chiens
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

// Types pour les locations (à venir)
export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  address: string;
}
