'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, tokenManager } from '@/shared/lib/api';

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

const USER_QUERY_KEY = ['user'] as const;

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(
    () => typeof window !== 'undefined' && tokenManager.exists()
  );

  const fetchUser = async (): Promise<UserProfile | null> => {
    if (!tokenManager.exists()) {
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

  const queryOptions: UseQueryOptions<UserProfile | null, Error, UserProfile | null, typeof USER_QUERY_KEY> = {
    queryKey: USER_QUERY_KEY,
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: hasToken,
    retry: hasToken ? 1 : false,
  };

  const {
    data: user,
    isLoading,
    isFetching,
    error,
  } = useQuery<UserProfile | null, Error, UserProfile | null, typeof USER_QUERY_KEY>(queryOptions);

  const logout = () => {
    void apiPost('/api/logout', {}).finally(() => {
      tokenManager.remove();
      queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
      window.dispatchEvent(new Event('auth-change'));
      setHasToken(false);
      router.push('/');
    });
  };

  useEffect(() => {
    const handleAuthChange = () => {
      const tokenPresent = tokenManager.exists();
      setHasToken(tokenPresent);
      if (tokenPresent) {
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      } else {
        queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!hasToken) {
      queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
    }
  }, [hasToken, queryClient]);

  const loading = hasToken && (isLoading || isFetching);

  return { user: user ?? null, loading, error, logout, isAuthenticated: !!user };
}
