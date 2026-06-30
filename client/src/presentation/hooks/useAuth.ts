'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, tokenManager } from '@/shared/lib/api';

export interface UserProfile {
  id: number;
  email: string;
  type: 'owner' | 'sitter';
  nom: string;
  prenom?: string;
  telephone: string;
  ville: string;
  photo_path?: string;
  siret?: string;
  is_verified?: boolean;
  is_admin?: boolean;
  roles?: string[];
  bio?: string | null;
  services?: string[];
  price_per_hour?: number | null;
  is_available?: boolean;
  experience_years?: number | null;
}

interface UseAuthReturn {
  user: UserProfile | null;
  loading: boolean;
  error: unknown;
  logout: () => void;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(
    () => typeof window !== 'undefined' && tokenManager.exists()
  );

  const fetchUser = async (): Promise<UserProfile | null> => {
    const token = tokenManager.get();
    if (!token) {
      setHasToken(false);
      return null;
    }

    const { ok, data, status } = await apiGet('/api/me');

    if (ok && data) {
      return data as UserProfile;
    }

    if (status === 401) {
      tokenManager.remove();
      setHasToken(false);
    }

    return null;
  };

  const queryKey = ['user'] satisfies QueryKey;
  const queryOptions: UseQueryOptions<UserProfile | null, Error, UserProfile | null, typeof queryKey> = {
    queryKey,
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // Cache user data for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused cache for 10 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus
    enabled: hasToken,
    retry: hasToken ? 1 : false,
  };

  const {
    data: user,
    isLoading,
    isFetching,
    error,
  } = useQuery<UserProfile | null, Error, UserProfile | null, typeof queryKey>(queryOptions);

  const logout = () => {
    tokenManager.remove();
    queryClient.removeQueries({ queryKey });
    window.dispatchEvent(new Event('auth-change'));
    setHasToken(false);
    router.push('/');
  };

  useEffect(() => {
    const handleAuthChange = () => {
      const tokenPresent = tokenManager.exists();
      setHasToken(tokenPresent);
      if (tokenPresent) {
        queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.removeQueries({ queryKey });
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [queryClient, queryKey]);

  useEffect(() => {
    if (!hasToken) {
      queryClient.removeQueries({ queryKey });
    }
  }, [hasToken, queryClient, queryKey]);

  const loading = hasToken && (isLoading || isFetching);

  return { user: user ?? null, loading, error, logout, isAuthenticated: !!user };
}
