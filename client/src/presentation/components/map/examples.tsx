'use client';

import { Map } from '@/presentation/components/map';
import { MapEvent } from '@/shared/types/map';

/**
 * Exemple simple d'utilisation du composant Map
 * Peut être importé et utilisé dans n'importe quelle page
 */
export function SimpleMapExample() {
  const events: MapEvent[] = [
    {
      id: 1,
      name: '🐕 Balade Canine',
      lat: 48.8606,
      lng: 2.3376,
      description: 'Rejoignez-nous pour une promenade au Jardin du Luxembourg !',
    },
  ];

  return (
    <div className="w-full h-[500px]">
      <Map events={events} />
    </div>
  );
}

/**
 * Exemple avec POI activés
 */
export function MapWithPOI() {
  const events: MapEvent[] = [
    {
      id: 1,
      name: 'Cours d\'agility',
      lat: 48.8566,
      lng: 2.3522,
      description: 'Cours d\'agility pour tous niveaux',
    },
  ];

  return (
    <div className="w-full h-[600px]">
      <Map events={events} showPOI={true} />
    </div>
  );
}

/**
 * Exemple avec position personnalisée (Marseille)
 */
export function MapCustomLocation() {
  const events: MapEvent[] = [
    {
      id: 1,
      name: 'Rencontre à Marseille',
      lat: 43.2965,
      lng: 5.3698,
      description: 'Grande rencontre canine sur le Vieux-Port',
    },
  ];

  return (
    <div className="w-full h-[500px]">
      <Map
        events={events}
        initialCenter={[5.3698, 43.2965]}
        initialZoom={14}
      />
    </div>
  );
}
