import type { Event } from '@/shared/types/event';

/**
 * Données d'événements (mock)
 * Règle: données séparées de la logique
 */
export const upcomingEvents: Event[] = [
  {
    id: 1,
    title: 'Grande Balade Canine au Parc',
    date: '2025-10-20',
    time: '14:00',
    location: 'Parc de la Tête d\'Or, Lyon',
    description: 'Rejoignez-nous pour une après-midi de jeux et de socialisation avec vos toutous !',
    category: 'Rencontre',
    attendees: 45,
    image: '🏃‍♂️',
  },
  {
    id: 2,
    title: 'Atelier Éducation Canine',
    date: '2025-10-25',
    time: '10:00',
    location: 'Centre Woofie, Paris',
    description: 'Apprenez les bases de l\'éducation positive avec notre éducateur certifié.',
    category: 'Formation',
    attendees: 20,
    image: '🎓',
  },
  {
    id: 3,
    title: 'Concours du Plus Beau Chien',
    date: '2025-11-05',
    time: '15:00',
    location: 'Place Bellecour, Lyon',
    description: 'Votre chien est le plus beau ? Venez le prouver et gagnez des prix !',
    category: 'Compétition',
    attendees: 80,
    image: '🏆',
  },
  {
    id: 4,
    title: 'Course Caritative pour les Refuges',
    date: '2025-11-12',
    time: '09:00',
    location: 'Bois de Vincennes, Paris',
    description: 'Courez avec votre chien pour soutenir les refuges locaux.',
    category: 'Charity',
    attendees: 150,
    image: '❤️',
  },
  {
    id: 5,
    title: 'Rencontre Bouledogues',
    date: '2025-11-18',
    time: '16:00',
    location: 'Parc Monceau, Paris',
    description: 'Spécial bouledogues ! Rencontrez d\'autres propriétaires et partagez vos expériences.',
    category: 'Rencontre',
    attendees: 30,
    image: '🐕',
  },
  {
    id: 6,
    title: 'Atelier Premiers Secours Canins',
    date: '2025-11-22',
    time: '14:00',
    location: 'Centre Vétérinaire, Marseille',
    description: 'Apprenez les gestes qui sauvent pour votre compagnon à quatre pattes.',
    category: 'Formation',
    attendees: 25,
    image: '🚑',
  },
];

export const pastEvents: Event[] = [
  {
    id: 7,
    title: 'Festival Woofie 2025',
    date: '2025-09-15',
    time: '10:00',
    location: 'Esplanade des Invalides, Paris',
    description: 'Notre premier festival ! Merci aux 500+ participants !',
    category: 'Rencontre',
    attendees: 523,
    image: '🎪',
  },
  {
    id: 8,
    title: 'Agility Championship 2025',
    date: '2025-09-10',
    time: '09:00',
    location: 'Stade Canin, Lyon',
    description: 'Félicitations à tous les participants de notre championnat d\'agility !',
    category: 'Compétition',
    attendees: 120,
    image: '🏅',
  },
];
