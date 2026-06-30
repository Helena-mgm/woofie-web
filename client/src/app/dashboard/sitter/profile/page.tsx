'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ProtectRoute } from '@/features/security/ProtectRoute';
import { useAuth } from '@/presentation/hooks/useAuth';
import { availableServices } from '@/infrastructure/data/services';
import { apiGet, apiPut } from '@/shared/lib/api';
import { Input, Button } from '@/presentation/components/ui';
import { Textarea } from '@/shared/ui/textarea';
import { LIMITS } from '@/infrastructure/config/constants';

interface SitterProfileResponse {
  id: number;
  bio?: string | null;
  services?: string[];
  price_per_hour?: number | null;
  is_available?: boolean;
  experience_years?: number | null;
  city?: string;
  telephone?: string;
  email: string;
}

type FormState = {
  bio: string;
  services: string[];
  price_per_hour: string;
  is_available: boolean;
  experience_years: string;
  ville: string;
  telephone: string;
};

export default function SitterProfilePage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>({
    bio: '',
    services: [],
    price_per_hour: '',
    is_available: true,
    experience_years: '',
    ville: '',
    telephone: '',
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const isSitter = user?.type === 'sitter';

  useEffect(() => {
    if (!isSitter) return;

    let cancelled = false;

    const loadProfile = async () => {
      const { ok, data } = await apiGet('/api/sitters/me');
      if (cancelled) return;

      if (ok && data) {
        const sitter = data as SitterProfileResponse;
        setForm({
          bio: sitter.bio ?? '',
          services: sitter.services ?? [],
          price_per_hour:
            sitter.price_per_hour !== null && sitter.price_per_hour !== undefined
              ? sitter.price_per_hour.toString()
              : '',
          is_available: sitter.is_available ?? true,
          experience_years:
            sitter.experience_years !== null && sitter.experience_years !== undefined
              ? sitter.experience_years.toString()
              : '',
          ville: sitter.city ?? user?.ville ?? '',
          telephone: sitter.telephone ?? user?.telephone ?? '',
        });
        setInitialised(true);
      } else {
        setServerError('Impossible de charger votre profil pour le moment.');
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isSitter, user?.telephone, user?.ville]);

  const toggleService = (service: string) => {
    setForm((prev) => {
      const hasService = prev.services.includes(service);
      return {
        ...prev,
        services: hasService
          ? prev.services.filter((item) => item !== service)
          : [...prev.services, service],
      };
    });
  };

  const hasChanges = useMemo(() => {
    if (!isSitter) return false;
    return initialised;
  }, [initialised, isSitter]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSitter) return;

    setServerError(null);
    setSuccess(null);
    setSaving(true);

    try {
      if (!form.bio.trim()) {
        throw new Error('Présentez vos services en quelques phrases.');
      }
      if (form.services.length === 0) {
        throw new Error('Sélectionnez au moins un service.');
      }
      if (form.price_per_hour === '' || Number(form.price_per_hour) <= 0) {
        throw new Error('Indiquez un tarif horaire valide.');
      }
      if (form.telephone && !/^0[1-9]\d{8}$/.test(form.telephone.replace(/\s+/g, ''))) {
        throw new Error('Format de téléphone invalide (ex: 0612345678).');
      }
      if (!form.ville.trim()) {
        throw new Error('Indiquez votre ville.');
      }

      const payload = {
        bio: form.bio.trim(),
        services: form.services,
        price_per_hour: Number(form.price_per_hour),
        is_available: form.is_available,
        experience_years: form.experience_years === '' ? null : Number(form.experience_years),
        ville: form.ville.trim(),
        telephone: form.telephone.replace(/\s+/g, ''),
      };

      const { ok } = await apiPut('/api/sitters/me', payload);
      if (ok) {
        setSuccess('Profil mis à jour avec succès ✨');
        window.dispatchEvent(new Event('auth-change'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de mettre à jour votre profil.';
      setServerError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
          <div className="text-center text-[#8B4513]">Chargement...</div>
        </div>
      </ProtectRoute>
    );
  }

  if (!isSitter) {
    return (
      <ProtectRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
          <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-[#8B4513]">Accès réservé</h2>
            <p className="mt-2 text-sm text-[#6B4A2B]">
              Cette page est dédiée aux dog-sitters. Connectez-vous avec un compte dog-sitter pour y accéder.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-full bg-[#D2691E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8B4513]"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </ProtectRoute>
    );
  }

  return (
    <ProtectRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#8B4513]">Mon profil dog-sitter</h1>
              <p className="text-sm text-[#6B4A2B]">
                Complétez vos informations pour aider les propriétaires à vous choisir.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#D2691E] px-4 py-2 text-sm font-semibold text-[#8B4513] hover:bg-[#FFF1E0]"
            >
              Retour
            </Link>
          </div>

          {serverError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-[#F1E5D4] bg-white p-6 shadow-xl">
            <section className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B4513]">
                  Présentation <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={5}
                  maxLength={LIMITS.maxBioLength}
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Décrivez votre expérience, votre environnement d'accueil, vos spécialités..."
                />
                <div className="flex justify-between text-xs text-[#6B4A2B]">
                  <span>Racontez qui vous êtes et ce que vous proposez (max {LIMITS.maxBioLength} caractères)</span>
                  <span>{form.bio.length}/{LIMITS.maxBioLength}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#8B4513]">Services proposés *</p>
                <div className="flex flex-wrap gap-2">
                  {availableServices.map((service) => {
                    const selected = form.services.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        aria-pressed={selected}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          selected ? 'bg-[#D2691E] text-white shadow' : 'bg-[#FFF5E6] text-[#8B4513] hover:bg-[#FFE4C4]'
                        }`}
                      >
                        {service}
                      </button>
                    );
                  })}
                </div>
                {form.services.length === 0 && (
                  <p className="text-xs text-red-600">Choisissez au moins un service</p>
                )}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Tarif horaire (€)"
                type="number"
                min={0}
                step="1"
                value={form.price_per_hour}
                onChange={(e) => setForm((prev) => ({ ...prev, price_per_hour: e.target.value }))}
                required
              />

              <Input
                label="Années d'expérience"
                type="number"
                min={0}
                step="1"
                value={form.experience_years}
                onChange={(e) => setForm((prev) => ({ ...prev, experience_years: e.target.value }))}
                placeholder="3"
              />

              <Input
                label="Ville"
                value={form.ville}
                onChange={(e) => setForm((prev) => ({ ...prev, ville: e.target.value }))}
                required
              />

              <Input
                label="Téléphone"
                value={form.telephone}
                onChange={(e) => setForm((prev) => ({ ...prev, telephone: e.target.value }))}
                placeholder="0612345678"
                required
              />
            </section>

            <section className="rounded-2xl border border-[#F1E5D4] bg-[#FFF8EF] px-4 py-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-[#8B4513]">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_available: e.target.checked }))}
                  className="h-4 w-4 rounded border-[#D2691E] text-[#D2691E] focus:ring-[#D2691E]"
                />
                Disponible pour de nouvelles demandes
              </label>
              <p className="mt-1 text-xs text-[#8B4513]/70">
                Décochez si vous ne prenez plus de nouveaux clients actuellement.
              </p>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#6B4A2B]">
                Les informations sauvegardées seront visibles sur votre profil public.
              </p>
              <Button type="submit" disabled={saving || !hasChanges} className="w-full sm:w-auto">
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectRoute>
  );
}
