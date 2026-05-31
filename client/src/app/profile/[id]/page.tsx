'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { ProtectRoute } from '@/features/security/ProtectRoute';
import { ProfileHeader } from '@/presentation/components/profile/ProfileHeader';
import { DogList } from '@/presentation/components/profile/DogList';
import { DogCard } from '@/presentation/components/profile/DogCard';
import { SitterServices } from '@/presentation/components/profile/SitterServices';
import { useProfile } from '@/presentation/hooks/useProfile';

/**
 * Instagram-like Profile Page
 * Rule: < 80 lines, clean design
 */
export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = parseInt(resolvedParams.id);
  const { profile, loading, error } = useProfile(userId);

  if (loading) {
    return (
      <ProtectRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="text-6xl"
          >
            🐕
          </motion.div>
        </div>
      </ProtectRoute>
    );
  }

  if (error || !profile) {
    return (
      <ProtectRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-gray-800">Profil introuvable</h2>
            <p className="text-gray-600 mt-2">{error || 'Ce profil n\'existe pas'}</p>
          </div>
        </div>
      </ProtectRoute>
    );
  }

  return (
    <ProtectRoute>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Instagram-style Header */}
          <ProfileHeader profile={profile} />

          {/* Owner dogs list */}
          {profile.type === 'owner' && profile.dogs && profile.dogs.length > 0 && (
            <DogList dogs={profile.dogs} />
          )}

          {/* Sitter services overview */}
          {profile.type === 'sitter' && (
            <SitterServices
              bio={profile.bio}
              services={profile.services}
              pricePerHour={profile.price_per_hour ?? null}
              isAvailable={profile.is_available}
              experienceYears={profile.experience_years ?? null}
              telephone={profile.telephone}
              email={profile.email}
            />
          )}

          {/* Tabs - Instagram style */}
          <div className="flex justify-center gap-12 mt-8 border-b border-gray-200">
            <button className="pb-4 border-t border-gray-900 text-sm font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              PUBLICATIONS
            </button>
          </div>

          {/* Dogs Grid - Instagram style (3 columns) */}
          {profile.type === 'owner' && profile.dogs && profile.dogs.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-1 mt-4"
            >
              {profile.dogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </motion.div>
          ) : null}
        </div>
      </div>
    </ProtectRoute>
  );
}
