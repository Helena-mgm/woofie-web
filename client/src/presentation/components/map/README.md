# Composant Map - Documentation

## Vue d'ensemble

Composant de carte interactif et responsive utilisant MapLibre GL JS pour afficher des événements et des points d'intérêt liés aux animaux de compagnie.

## Installation

Les dépendances sont déjà installées :
```bash
npm install maplibre-gl
npm install --save-dev @types/maplibre-gl
```

## Utilisation de base

```tsx
import { Map, MapEvent } from '@/components/map';

const events: MapEvent[] = [
  {
    id: 1,
    name: 'Rencontre Canine',
    lat: 48.8566,
    lng: 2.3522,
    description: 'Une super rencontre entre chiens',
  },
];

function MyPage() {
  return (
    <div className="h-screen">
      <Map events={events} showPOI={true} />
    </div>
  );
}
```

## Props

### MapProps

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `events` | `MapEvent[]` | `[]` | Liste des événements à afficher sur la carte |
| `showPOI` | `boolean` | `false` | Active/désactive l'affichage des points d'intérêt |
| `className` | `string` | `''` | Classes CSS additionnelles |
| `initialCenter` | `[number, number]` | `[2.3522, 48.8566]` | Coordonnées initiales [lng, lat] |
| `initialZoom` | `number` | `12` | Niveau de zoom initial |

### MapEvent

```typescript
interface MapEvent {
  id: number;          // Identifiant unique
  name: string;        // Nom de l'événement
  lat: number;         // Latitude
  lng: number;         // Longitude
  description: string; // Description de l'événement
}
```

## Fonctionnalités

### 1. Affichage des événements
- Les événements sont affichés avec des marqueurs marron en forme de patte 🐾
- Cliquez sur un marqueur pour voir le nom et la description
- Les marqueurs ont une animation au survol

### 2. Géolocalisation
- La carte détecte automatiquement votre position
- Le contrôle de géolocalisation est disponible en haut à droite
- La carte se centre automatiquement sur votre position

### 3. Points d'intérêt (POI)
Quand `showPOI={true}`, la carte affiche les POI suivants :
- 🏥 Vétérinaires (`amenity=veterinary`)
- 🌳 Parcs à chiens (`leisure=dog_park`)
- 🏪 Animaleries (`shop=pet`)

Les POI sont affichés avec des marqueurs bleus et chargés dynamiquement depuis OpenStreetMap.

### 4. Contrôles de navigation
- Zoom +/-
- Rotation de la carte
- Géolocalisation
- Tous disponibles en haut à droite

### 5. Légende
Une légende est affichée en bas à gauche pour identifier les différents types de marqueurs.

## Styles personnalisés

### Marqueurs d'événements
Couleur marron `#8B4513` avec icône de patte blanche.

### Marqueurs POI
Couleur bleue `#3B82F6` pour une meilleure distinction.

## Responsive Design

Le composant est entièrement responsive :
- Adapte automatiquement sa taille au conteneur parent
- Les popups s'ajustent sur mobile
- Les contrôles sont optimisés pour le tactile

## Nettoyage automatique

Le composant gère automatiquement :
- La suppression de tous les marqueurs au démontage
- La destruction de l'instance de carte
- Le nettoyage des écouteurs d'événements

## Exemple complet

```tsx
'use client';

import { useState } from 'react';
import { Map, MapEvent } from '@/components/map';

export default function EventsMapPage() {
  const [showPOI, setShowPOI] = useState(false);
  
  const events: MapEvent[] = [
    {
      id: 1,
      name: 'Rencontre au parc',
      lat: 48.8606,
      lng: 2.3376,
      description: 'Rencontre entre propriétaires de chiens',
    },
    // ... plus d'événements
  ];

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 bg-white shadow">
        <h1 className="text-2xl font-bold">Carte des événements</h1>
        <label className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={showPOI}
            onChange={(e) => setShowPOI(e.target.checked)}
          />
          Afficher les POI
        </label>
      </header>
      
      <div className="flex-1">
        <Map
          events={events}
          showPOI={showPOI}
          initialCenter={[2.3522, 48.8566]}
          initialZoom={13}
        />
      </div>
    </div>
  );
}
```

## API externe utilisée

### OpenStreetMap Overpass API
Utilisée pour récupérer les POI en temps réel.

**Endpoint :** `https://overpass-api.de/api/interpreter`

**Limites :**
- Timeout de 25 secondes
- Requêtes limitées par IP
- Les POI sont rechargés à chaque déplacement de carte

## Performance

### Optimisations
- Les marqueurs sont réutilisés quand possible
- Les POI ne sont chargés que si `showPOI` est activé
- Le rechargement des POI est déclenché uniquement à la fin du déplacement
- Nettoyage automatique de la mémoire

### Recommandations
- Limitez le nombre d'événements affichés simultanément (< 100)
- Activez `showPOI` uniquement quand nécessaire
- Utilisez un conteneur avec une hauteur définie

## Dépannage

### La carte ne s'affiche pas
Vérifiez que le conteneur parent a une hauteur définie :
```tsx
<div className="h-screen"> {/* ou h-[600px] */}
  <Map events={events} />
</div>
```

### Les POI ne se chargent pas
- Vérifiez votre connexion internet
- L'API Overpass peut être temporairement indisponible
- Essayez de zoomer/déplacer la carte pour recharger

### Erreurs de géolocalisation
- Autorisez la géolocalisation dans votre navigateur
- HTTPS est requis pour la géolocalisation
- Sur mobile, vérifiez les permissions de l'application

## Prochaines améliorations possibles

- [ ] Clustering des marqueurs pour de grandes quantités d'événements
- [ ] Filtrage des types de POI
- [ ] Recherche par adresse
- [ ] Itinéraire vers un événement
- [ ] Export de la carte en image
- [ ] Mode sombre
- [ ] Support de différents styles de carte

## Ressources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/api/)
- [Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [OpenStreetMap Tagging](https://wiki.openstreetmap.org/wiki/Map_Features)
