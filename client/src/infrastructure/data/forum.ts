import type { Post } from '@/shared/types/forum';

/**
 * Données mockées du forum
 * Règle: données séparées de la logique
 */
export const mockPosts: Post[] = [
  {
    id: 1,
    user: {
      id: 1,
      email: 'marie@example.com',
      nom: 'Dupont',
      prenom: 'Marie',
      photo_path: '/paw-print.svg',
      type: 'owner',
      city: 'Paris',
      bio: 'Amoureuse des chiens depuis toujours 🐕'
    },
    content: 'Magnifique journée au parc avec Max ! Il a rencontré plein de nouveaux copains 🎾🐶\n\nQuelqu\'un connaît un bon parc à chiens dans le 15ème ?',
    images: ['/pet_dog_sleep.png'],
    dogs: [
      {
        id: 1,
        name: 'Max',
        breed: 'Golden Retriever',
        age: 3,
        owner_id: 1
      }
    ],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes_count: 24,
    comments_count: 5,
    shares_count: 2,
    is_liked: false,
    is_saved: false
  },
  {
    id: 2,
    user: {
      id: 2,
      email: 'thomas@example.com',
      nom: 'Martin',
      prenom: 'Thomas',
      type: 'owner',
      city: 'Lyon',
      bio: 'Papa de 2 toutous adorables'
    },
    content: 'Première séance d\'agility pour Luna aujourd\'hui ! Elle a adoré 🏆\n\nElle était tellement excitée qu\'elle a sauté par-dessus tous les obstacles sans même attendre mes ordres 😅',
    dogs: [
      {
        id: 2,
        name: 'Luna',
        breed: 'Border Collie',
        age: 2,
        owner_id: 2
      }
    ],
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes_count: 42,
    comments_count: 12,
    shares_count: 3,
    is_liked: true,
    is_saved: false
  },
  {
    id: 3,
    user: {
      id: 3,
      email: 'sophie@example.com',
      nom: 'Bernard',
      prenom: 'Sophie',
      type: 'owner',
      city: 'Marseille'
    },
    content: '🎉 Anniversaire de Bella aujourd\'hui ! 5 ans déjà ! 🎂\n\nLe temps passe tellement vite... Merci à tous mes amis Woofie pour vos adorables messages ❤️',
    images: ['/image.png', '/pet_dog_sleep.png'],
    dogs: [
      {
        id: 3,
        name: 'Bella',
        breed: 'Labrador',
        age: 5,
        owner_id: 3
      }
    ],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    likes_count: 156,
    comments_count: 34,
    shares_count: 8,
    is_liked: false,
    is_saved: true
  }
];
