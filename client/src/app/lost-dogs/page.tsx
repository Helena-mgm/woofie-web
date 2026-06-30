'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { apiRequest } from '@/shared/lib/api';
import { getImageUrl } from '@/infrastructure/config/constants';
import type { DogProfile } from '@/presentation/hooks/useDogs';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'il y a moins d\'1 h';
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} jour${d > 1 ? 's' : ''}`;
}

export default function LostDogsPage() {
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/dogs/lost')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setDogs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-[#FFF5E6] py-12">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🚨</span>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Chiens perdus</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Alertes actives dans votre communauté. Si vous avez des informations, contactez le propriétaire.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 w-fit">
            <span>⚠️</span>
            <span>{dogs.length} chien{dogs.length !== 1 ? 's' : ''} actuellement recherché{dogs.length !== 1 ? 's' : ''}</span>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-gray-500 animate-pulse text-lg">Chargement des alertes…</div>
        )}

        {/* Empty */}
        {!loading && dogs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-xl font-semibold text-gray-700">Aucun chien perdu signalé</p>
            <p className="text-gray-400 mt-2">Bonne nouvelle pour la communauté ! 🎉</p>
          </div>
        )}

        {/* Grid */}
        {!loading && dogs.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dogs.map((dog, i) => (
              <LostDogCard key={dog.id} dog={dog} index={i} />
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🐾 Vous avez perdu votre chien ?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Signalez-le depuis la page de votre chien dans votre tableau de bord. Une alerte sera aussitôt visible sur cette page et sur la carte.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D2691E] text-white text-sm font-semibold hover:bg-[#8B4513] transition-colors"
          >
            Mon tableau de bord →
          </a>
        </div>
      </div>
    </div>
  );
}

function LostDogCard({ dog, index }: { dog: DogProfile; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-red-200 hover:border-red-400 transition-colors"
    >
      {/* Photo */}
      <div className="relative h-48 bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
        {dog.photo ? (
          <Image
            src={getImageUrl(dog.photo)}
            alt={dog.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <span className="text-7xl opacity-40">🐕</span>
        )}
        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          🚨 PERDU
        </span>
        {dog.lostSince && (
          <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {timeAgo(dog.lostSince)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{dog.name}</h3>
            {dog.race && <p className="text-sm text-gray-500">{dog.race}{dog.age ? ` · ${dog.age} ans` : ''}</p>}
          </div>
          {dog.sexe && (
            <span className="flex-shrink-0 text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {dog.sexe === 'M' ? '♂ Mâle' : '♀ Femelle'}
            </span>
          )}
        </div>

        {dog.lostLocation && (
          <div className="flex items-start gap-1.5 text-sm text-gray-600">
            <span className="mt-0.5 flex-shrink-0">📍</span>
            <span>{dog.lostLocation}</span>
          </div>
        )}

        {dog.lostDescription && (
          <p className="text-sm text-gray-600 line-clamp-2 border-t border-gray-50 pt-2">{dog.lostDescription}</p>
        )}

        {dog.lostLat && dog.lostLng && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${dog.lostLat}&mlon=${dog.lostLng}#map=15/${dog.lostLat}/${dog.lostLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#D2691E] hover:underline"
          >
            🗺️ Voir sur la carte
          </a>
        )}

        {/* Contact */}
        {dog.lostContact && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Contacter le propriétaire</p>
            <a
              href={dog.lostContact.includes('@') ? `mailto:${dog.lostContact}` : `tel:${dog.lostContact}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors"
            >
              <span>{dog.lostContact.includes('@') ? '✉️' : '📞'}</span>
              <span className="truncate">{dog.lostContact}</span>
            </a>
          </div>
        )}

        {dog.ownerName && (
          <p className="text-xs text-gray-400">Propriétaire : {dog.ownerName}</p>
        )}
      </div>
    </motion.article>
  );
}
