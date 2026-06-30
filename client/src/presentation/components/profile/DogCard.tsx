'use client';

import Image from 'next/image';
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
        <Image
          src={getImageUrl(dog.photoPath)}
          alt={dog.nom}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 200px"
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
