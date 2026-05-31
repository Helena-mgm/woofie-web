// Constantes de configuration

// Constantes de thème
export const COLORS = {
  primary: '#D2691E',
  secondary: '#8B4513',
  accent: '#A0522D',
  background: {
    light: '#FFF5E6',
    medium: '#FFE8CC',
    dark: '#FFD9A6',
  },
  brown: {
    light: '#C9A87C',
    medium: '#8B4513',
    dark: '#6B4423',
  },
  error: '#DC2626',
  success: '#16A34A',
} as const;

// Constantes pour les animations
export const ANIMATION_DURATION = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
} as const;

// Constantes pour la validation
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email invalide',
  },
  password: {
    minLength: 8,
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  },
  // Format téléphone français (10 chiffres, commence par 0)
  phone: {
    pattern: /^0[1-9]\d{8}$/,
    message: 'Numéro de téléphone invalide (ex: 0612345678)',
  },
  // Format ICAD : 
  // - Puce électronique: 15 chiffres (ex: 250269801234567)
  // - Tatouage: 3 lettres + 3 chiffres (ex: ABC123) ou 6 chiffres + 3 lettres (ex: 123456ABC)
  icad: {
    // Accepte les deux formats
    pattern: /^(\d{15}|[A-Z]{3}\d{3}|\d{6}[A-Z]{3})$/,
    microchipPattern: /^\d{15}$/, // Puce électronique uniquement
    tattooPattern: /^([A-Z]{3}\d{3}|\d{6}[A-Z]{3})$/, // Tatouage uniquement
    message: 'Numéro ICAD invalide. Format attendu : 15 chiffres (puce) ou ABC123 / 123456ABC (tatouage)',
    microchipMessage: 'Puce électronique : 15 chiffres',
    tattooMessage: 'Tatouage : ABC123 ou 123456ABC',
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/,
    message: 'Nom invalide (lettres, espaces, apostrophes et tirets uniquement)',
  },
  city: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ\s'-]+$/,
    message: 'Ville invalide',
  },
  // Format SIRET : 14 chiffres
  siret: {
    pattern: /^\d{14}$/,
    message: 'Numéro SIRET invalide (14 chiffres requis)',
  },
} as const;

// Routes de l'application
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  profile: '/profile',
  dogs: '/dogs',
  messages: '/messages',
  settings: '/settings',
} as const;

// Messages d'erreur
export const ERROR_MESSAGES = {
  network: 'Erreur réseau. Vérifiez votre connexion.',
  server: 'Erreur serveur. Veuillez réessayer plus tard.',
  unauthorized: 'Vous devez être connecté pour accéder à cette page.',
  forbidden: 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.',
  notFound: 'Ressource non trouvée.',
  validation: 'Erreur de validation. Vérifiez vos données.',
  unknown: 'Une erreur inattendue s\'est produite.',
} as const;

// Configuration de l'API
// Important: utiliser une base vide ('') rendra les requêtes relatives (ex: '/api/me').
// Cela évite les fetch vers un host externe (ex: http://localhost:8000) qui peuvent
// être inaccessibles depuis le navigateur quand l'app est servie derrière un proxy/nginx
// et provoquent de longs délais d'attente. En environnement où une URL externe est
// nécessaire, définir NEXT_PUBLIC_API_URL lors du build/runtime.
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  timeout: 10000,
  endpoints: {
    login: '/api/login',
    register: '/api/register',
    logout: '/api/logout',
    me: '/api/me',
    dogs: '/api/dogs',
    locations: '/api/locations',
  },
} as const;

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '/pet_dog_sleep.png'; // Default fallback
  
  // If path already starts with http, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If path starts with /, prepend backend URL
  if (path.startsWith('/')) {
    return `${API_CONFIG.baseUrl}${path}`;
  }
  
  // Otherwise, assume it's a public asset
  return path;
};

// Configuration de l'application
export const APP_CONFIG = {
  name: 'Woofie',
  description: 'Le réseau social des toutous',
  version: '1.0.0',
  supportEmail: 'support@woofie.fr',
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Limites et contraintes
export const LIMITS = {
  maxIcadNumbers: 10, // Maximum 10 chiens par propriétaire
  maxPhotos: 5,
  maxBioLength: 500,
  maxNameLength: 50,
} as const;
