import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Dog } from '@/types';
import { getImageUrl } from '@/infrastructure/config/constants';

interface DogListProps {
  dogs: Dog[];
}

export function DogList({ dogs }: DogListProps) {
  return (
    <div className="mt-8 mb-8">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 px-1">
        MES CHIENS ({dogs.length})
      </h3>
      
      <div className="flex flex-wrap gap-4">
        {dogs.map((dog, index) => (
          <motion.div
            key={dog.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex w-20 flex-col items-center gap-1.5"
          >
            <Link href={`/dog/${dog.id}`} className="group">
              <div className="relative aspect-square w-16 h-16 overflow-hidden rounded-full bg-gray-100 ring-2 ring-offset-2 ring-[#F1E5D4] cursor-pointer">
                <Image
                  src={getImageUrl(dog.photoPath)}
                  alt={dog.nom}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="64px"
                />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
            </Link>
            <span className="w-full truncate text-center text-xs font-medium text-gray-700">
              {dog.nom}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
