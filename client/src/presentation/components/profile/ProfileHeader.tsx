'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/infrastructure/config/constants';

interface ProfileHeaderProps {
  profile: {
    type: 'owner' | 'sitter';
    nom: string;
    prenom?: string;
    ville: string;
    photoPath: string | null;
    isVerified?: boolean;
    isAdmin?: boolean;
    bio?: string | null;
    services?: string[];
    price_per_hour?: number | null;
    is_available?: boolean;
    experience_years?: number | null;
    stats: {
      totalDogs?: number;
      verified?: boolean;
      member_since: string;
    };
  };
}

/**
 * Instagram-like Profile Header
 * Rule: < 60 lines, clean design
 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const fullName = profile.prenom ? `${profile.prenom} ${profile.nom}` : profile.nom;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-8 pb-8 border-b border-gray-200"
    >
      {/* Avatar - Instagram style */}
      <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-gray-200 flex-shrink-0">
        {profile.photoPath ? (
          <Image
            src={getImageUrl(profile.photoPath)}
            alt={fullName}
            fill
            className="object-cover"
            sizes="144px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200">
            {profile.type === 'owner' ? '👤' : '🐕‍🦺'}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex-1 pt-4">
        {/* Username + Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-3xl font-light text-gray-900">{fullName}</h1>
          {profile.isAdmin && (
            <span className="px-2.5 py-1 bg-red-100 text-red-600 border border-red-300 text-xs font-bold rounded uppercase tracking-wide">
              🔴 Admin
            </span>
          )}
          {profile.isVerified ? (
            <div className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Vérifié
            </div>
          ) : (
            <div className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-semibold rounded flex items-center gap-1 border border-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              Non vérifié
            </div>
          )}
        </div>

        {/* Stats - Instagram style */}
        <div className="flex gap-10 mb-6 text-base">
          {profile.stats.totalDogs !== undefined && (
            <div>
              <span className="font-semibold text-gray-900">{profile.stats.totalDogs}</span>
              <span className="text-gray-600 ml-1">chien{profile.stats.totalDogs > 1 ? 's' : ''}</span>
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

        {/* Bio & details */}
        <div className="space-y-3 text-sm text-gray-700">
          <div className="font-semibold text-gray-900">
            {profile.type === 'owner' ? '🐾 Propriétaire de toutous adorables' : '🐕‍🦺 Dog-sitter professionnel'}
          </div>
          <div className="text-gray-600">📍 {profile.ville}</div>

          {profile.type === 'sitter' && (
            <>
              <p className="leading-relaxed text-gray-700 whitespace-pre-line">
                {profile.bio && profile.bio.trim().length > 0
                  ? profile.bio
                  : 'Ce dog-sitter complétera sa présentation prochainement.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#8B4513]">
                {profile.price_per_hour !== null && profile.price_per_hour !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0E0] px-3 py-1 font-semibold">
                    💶 {profile.price_per_hour.toFixed(2)} €/h
                  </span>
                )}
                {profile.experience_years !== null && profile.experience_years !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FBEDEA] px-3 py-1 font-semibold">
                    🕒 {profile.experience_years} an{profile.experience_years > 1 ? 's' : ''} d&apos;expérience
                  </span>
                )}
                {profile.is_available !== undefined && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${profile.is_available ? 'bg-[#E7F8EF] text-[#197A43]' : 'bg-[#FDECEC] text-[#B42323]'}`}>
                    {profile.is_available ? '✅ Disponible' : '⏳ Complet actuellement'}
                  </span>
                )}
              </div>

              {profile.services && profile.services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.services.map((service) => (
                    <span key={service} className="rounded-full bg-[#FFF5E6] px-3 py-1 text-xs font-semibold text-[#8B4513]">
                      {service}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div> 
      </div>
    </motion.div>
  );
}
