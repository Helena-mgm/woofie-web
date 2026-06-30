import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Dog } from '@/types';
import { getImageUrl } from '@/infrastructure/config/constants';

/**
 * Simple Dog List - Instagram Grid Style
 * Rule: < 50 lines, clean & simple
 */

interface DogListProps {
  dogs: Dog[];
}

export function DogList({ dogs }: DogListProps) {
  return (
    <div className="mt-8 mb-8">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 px-1">
        MES CHIENS ({dogs.length})
      </h3>
      
      <div className="grid grid-cols-3 gap-1">
        {dogs.map((dog, index) => (
          <motion.div
            key={dog.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/dog/${dog.id}`}>
              <div className="relative aspect-square overflow-hidden bg-gray-100 group cursor-pointer">
                <Image
                  src={getImageUrl(dog.photoPath)}
                  alt={dog.nom}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
