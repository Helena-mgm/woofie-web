'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/shared/lib/api';

export interface DogProfile {
  id: number;
  name: string;
  icadNumber: string;
  icadType: string;
  race?: string | null;
  taille?: string | null;
  sexe?: string | null;
  age?: number | null;
  dateNaissance?: string | null;
  description?: string | null;
  photo?: string | null;
  isLost: boolean;
  lostSince?: string | null;
  lostLocation?: string | null;
  lostLat?: number | null;
  lostLng?: number | null;
  lostContact?: string | null;
  lostDescription?: string | null;
  ownerName?: string | null;
  ownerId?: number | null;
  createdAt?: string;
}

export function useDogs() {
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [lostDogs, setLostDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/dogs/mine');
      if (res.ok) setDogs(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchLost = useCallback(async () => {
    try {
      const res = await apiRequest('/api/dogs/lost');
      if (res.ok) setLostDogs(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchMine();
    fetchLost();
  }, [fetchMine, fetchLost]);

  const createDog = useCallback(async (payload: Omit<DogProfile, 'id' | 'isLost' | 'createdAt'>): Promise<DogProfile | null> => {
    try {
      const res = await apiRequest('/api/dogs', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) return null;
      const created = await res.json() as DogProfile;
      setDogs(prev => [...prev, created]);
      return created;
    } catch { return null; }
  }, []);

  const updateDog = useCallback(async (id: number, payload: Partial<DogProfile>): Promise<DogProfile | null> => {
    try {
      const res = await apiRequest(`/api/dogs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (!res.ok) return null;
      const updated = await res.json() as DogProfile;
      setDogs(prev => prev.map(d => d.id === id ? updated : d));
      return updated;
    } catch { return null; }
  }, []);

  const deleteDog = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await apiRequest(`/api/dogs/${id}`, { method: 'DELETE' });
      if (!res.ok) return false;
      setDogs(prev => prev.filter(d => d.id !== id));
      return true;
    } catch { return false; }
  }, []);

  const markLost = useCallback(async (id: number, data: {
    location?: string; lat?: number; lng?: number; contact?: string; description?: string;
  }): Promise<DogProfile | null> => {
    try {
      const res = await apiRequest(`/api/dogs/${id}/lost`, { method: 'POST', body: JSON.stringify(data) });
      if (!res.ok) return null;
      const updated = await res.json() as DogProfile;
      setDogs(prev => prev.map(d => d.id === id ? updated : d));
      setLostDogs(prev => [updated, ...prev.filter(d => d.id !== id)]);
      return updated;
    } catch { return null; }
  }, []);

  const markFound = useCallback(async (id: number): Promise<DogProfile | null> => {
    try {
      const res = await apiRequest(`/api/dogs/${id}/found`, { method: 'POST' });
      if (!res.ok) return null;
      const updated = await res.json() as DogProfile;
      setDogs(prev => prev.map(d => d.id === id ? updated : d));
      setLostDogs(prev => prev.filter(d => d.id !== id));
      return updated;
    } catch { return null; }
  }, []);

  return {
    dogs, lostDogs, loading,
    createDog, updateDog, deleteDog,
    markLost, markFound,
    refetch: fetchMine,
    refetchLost: fetchLost,
  };
}
