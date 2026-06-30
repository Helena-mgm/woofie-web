import { useState, useEffect } from 'react';
import { apiGet } from '@/shared/lib/api';
import type { Dog } from '@/types';

interface ProfileData {
  id: number;
  type: 'owner' | 'sitter';
  nom: string;
  prenom?: string;
  ville: string;
  telephone: string;
  photoPath: string | null;
  email: string;
  dogs?: Dog[];
  siret?: string;
  isVerified?: boolean;
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
}

const profileCache = new Map<number, { data: ProfileData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const profileDebugEnabled = process.env.NEXT_PUBLIC_PROFILE_DEBUG === 'true';

/**
 * Hook pour charger un profil utilisateur avec cache
 * Rule: < 80 lines, optimized with caching
 */
export function useProfile(userId: number | null) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = profileCache.get(userId);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setProfile(cached.data);
        setLoading(false);
        return;
      }

      try {
        const { ok, data } = await apiGet(`/api/profile/${userId}`);

        if (ok && data) {
          const profileData = data as ProfileData;
          profileCache.set(userId, { data: profileData, timestamp: now });
          setProfile(profileData);
        } else {
          throw new Error('Profil introuvable');
        }
      } catch (err) {
        if (profileDebugEnabled) {
          console.error('❌ [useProfile] Error:', err);
        }
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
}
