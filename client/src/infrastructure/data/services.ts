import { DogSitter } from '@/shared/types/forum';

/**
 * Mock data for dog-sitting services
 * Separated from UI for clean architecture
 */
export const mockDogSitters: DogSitter[] = [
  {
    id: 1,
    email: 'julie@example.com',
    nom: 'Leblanc',
    prenom: 'Julie',
    photo_path: '/paw-print.svg',
    type: 'dogsitter',
    city: 'Paris 15e',
    bio: 'Passionnée par les chiens depuis 10 ans. Garde à domicile ou promenades au coucher du soleil.',
    rating: 4.9,
    reviews_count: 47,
    price_per_hour: 15,
    services: ['Garde à domicile', 'Promenade', 'Éducation chiot'],
    availability: true
  },
  {
    id: 2,
    email: 'marc@example.com',
    nom: 'Durand',
    prenom: 'Marc',
    type: 'dogsitter',
    city: 'Paris 12e',
    bio: 'Éducateur canin certifié, spécialisé dans les chiots et les chiens anxieux.',
    rating: 5.0,
    reviews_count: 89,
    price_per_hour: 20,
    services: ['Éducation chiot', 'Promenade', 'Garde à domicile'],
    availability: true
  },
  {
    id: 3,
    email: 'emma@example.com',
    nom: 'Petit',
    prenom: 'Emma',
    type: 'dogsitter',
    city: 'Paris 18e',
    bio: 'Maison de ville avec jardin, idéale pour les chiens plein d’énergie.',
    rating: 4.7,
    reviews_count: 32,
    price_per_hour: 12,
    services: ['Garde à domicile', 'Promenade'],
    availability: false
  },
  {
    id: 4,
    email: 'thomas@example.com',
    nom: 'Martin',
    prenom: 'Thomas',
    type: 'dogsitter',
    city: 'Paris 11e',
    bio: 'Vétérinaire à la retraite, expérience avec toutes les races et les soins médicaux.',
    rating: 4.8,
    reviews_count: 56,
    price_per_hour: 18,
    services: ['Garde à domicile', 'Promenade', 'Soins'],
    availability: true
  },
  {
    id: 5,
    email: 'sophie@example.com',
    nom: 'Bernard',
    prenom: 'Sophie',
    type: 'dogsitter',
    city: 'Paris 9e',
    bio: 'Toiletteuse professionnelle. Propose promenades urbaines et séances bien-être.',
    rating: 4.6,
    reviews_count: 28,
    price_per_hour: 22,
    services: ['Toilettage', 'Promenade'],
    availability: false
  }
];

export const availableServices = [
  'Garde à domicile',
  'Promenade',
  'Éducation chiot',
  'Toilettage',
  'Soins'
] as const;

export type ServiceType = typeof availableServices[number];
