'use client';

import { motion } from 'framer-motion';
import { getImageUrl } from '@/infrastructure/config/constants';

interface DogCardProps {
  dog: {
    id: number;
    nom: string;
    race: string | null;
    sexe: string | null;
    dateNaissance: string | null;
    photoPath: string | null;
  };
}

/**
 * Instagram-style Dog Card - Square Grid
 * Rule: < 30 lines
 */
export function DogCard({ dog }: DogCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer group"
    >
      {dog.photoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={getImageUrl(dog.photoPath)} 
          alt={dog.nom} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200">
          🐕
        </div>
      )}
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="text-center text-white">
          <p className="text-xl font-semibold">{dog.nom}</p>
          {dog.race && <p className="text-sm">{dog.race}</p>}
        </div>
      </div>
    </motion.div>
  );
}
