'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProtectRoute } from '@/features/security/ProtectRoute';
import { DogProfileHeader } from '@/presentation/components/profile/DogProfileHeader';
import { apiGet } from '@/shared/lib/api-v2';

/**
 * Dog Profile Page - Same design as Owner Profile
 * Rule: < 80 lines, Instagram style
 */
export default function DogProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const dogId = parseInt(resolvedParams.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dog, setDog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDog = async () => {
      try {
        const response = await apiGet(`/api/dog/${dogId}`);
        if (response.ok && response.data) {
          setDog(response.data);
        } else {
          setError('Chien introuvable');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchDog();
  }, [dogId]);

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

  if (error || !dog) {
    return (
      <ProtectRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-gray-800">Chien introuvable</h2>
            <p className="text-gray-600 mt-2">{error || 'Ce chien n\'existe pas'}</p>
          </div>
        </div>
      </ProtectRoute>
    );
  }

  return (
    <ProtectRoute>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Dog Profile Header - Same design as ProfileHeader */}
          <DogProfileHeader dog={dog} owner={dog.owner} />

          {/* Tabs - Instagram style (same as owner profile) */}
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

          {/* Empty state for now - Same as owner profile */}
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4">📷</div>
            <p className="text-lg">Aucune publication pour le moment</p>
          </div>
        </div>
      </div>
    </ProtectRoute>
  );
}
