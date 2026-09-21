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

export const ANIMATION_DURATION = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
} as const;

export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email invalide',
  },
  password: {
    minLength: 12,
    message: 'Le mot de passe doit contenir au moins 12 caractères',
  },
  phone: {
    pattern: /^0[1-9]\d{8}$/,
    message: 'Numéro de téléphone invalide (ex: 0612345678)',
  },
  icad: {
    pattern: /^(\d{15}|[A-Z]{3}\d{3}|\d{6}[A-Z]{3})$/,
    microchipPattern: /^\d{15}$/,
    tattooPattern: /^([A-Z]{3}\d{3}|\d{6}[A-Z]{3})$/,
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
  siret: {
    pattern: /^\d{14}$/,
    message: 'Numéro SIRET invalide (14 chiffres requis)',
  },
} as const;

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

export const ERROR_MESSAGES = {
  network: 'Erreur réseau. Vérifiez votre connexion.',
  server: 'Erreur serveur. Veuillez réessayer plus tard.',
  unauthorized: 'Vous devez être connecté pour accéder à cette page.',
  forbidden: 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.',
  notFound: 'Ressource non trouvée.',
  validation: 'Erreur de validation. Vérifiez vos données.',
  unknown: 'Une erreur inattendue s\'est produite.',
} as const;

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

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '/pet_dog_sleep.png';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${API_CONFIG.baseUrl}${path}`;
  }

  return path;
};

export const APP_CONFIG = {
  name: 'Woofie',
  description: 'Le réseau social des toutous',
  version: '1.0.0',
  supportEmail: 'support@woofie.fr',
  maxFileSize: 5 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const LIMITS = {
  maxIcadNumbers: 10,
  maxPhotos: 5,
  maxBioLength: 500,
  maxNameLength: 50,
} as const;
