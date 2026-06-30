'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/infrastructure/config/constants';

interface DogProfileHeaderProps {
  dog: {
    nom: string;
    race: string | null;
    sexe: string | null;
    dateNaissance: string | null;
    photoPath: string | null;
    description?: string | null;
  };
  owner: {
    id: number;
    nom: string;
    photoPath?: string | null;
  };
}

/**
 * Dog Profile Header - Same design as ProfileHeader
 * Rule: < 80 lines, Instagram style
 */
export function DogProfileHeader({ dog, owner }: DogProfileHeaderProps) {
  // Calculate age
  const birthDate = dog.dateNaissance ? new Date(dog.dateNaissance) : null;
  const age = birthDate 
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-8 pb-8 border-b border-gray-200"
    >
      {/* Avatar - Instagram style (same as ProfileHeader) */}
      <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 flex-shrink-0">
        <Image
          src={getImageUrl(dog.photoPath)}
          alt={dog.nom}
          fill
          className="object-cover"
          sizes="144px"
        />
      </div>

      {/* Info Section */}
      <div className="flex-1 pt-4">
        {/* Dog Name */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-light text-gray-900">{dog.nom}</h1>
          <span className="text-2xl">{dog.sexe === 'male' ? '♂️' : '♀️'}</span>
        </div>

        {/* Stats - Instagram style (same layout) */}
        <div className="flex gap-10 mb-6 text-base">
          {age !== null && (
            <div>
              <span className="font-semibold text-gray-900">{age}</span>
              <span className="text-gray-600 ml-1">an{age > 1 ? 's' : ''}</span>
            </div>
          )}
          <div>
            <span className="font-semibold text-gray-900">0</span>
            <span className="text-gray-600 ml-1">publications</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">0</span>
            <span className="text-gray-600 ml-1">abonnés</span>
          </div>
        </div>

        {/* Owner Info - Prominently displayed */}
        <Link href={`/profile/${owner.id}`}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors mb-4 w-fit"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white">
              {owner.photoPath ? (
                <Image
                  src={getImageUrl(owner.photoPath)}
                  alt={owner.nom}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  👤
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Propriétaire</div>
              <div className="text-sm font-semibold text-gray-900">{owner.nom}</div>
            </div>
          </motion.div>
        </Link>

        {/* Bio - Instagram style */}
        <div className="text-sm space-y-1">
          <div className="text-gray-600">
            <span className="font-semibold text-gray-900">{dog.race}</span>
          </div>
          {dog.description && (
            <div className="text-gray-700">{dog.description}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
